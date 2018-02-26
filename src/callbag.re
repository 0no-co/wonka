open Callbag_types;
open Callbag_helpers;

module Types = Callbag_types;

let fromList = (l, sink) => {
  let restL = ref(l);

  makeTrampoline(sink, [@bs] () => {
    switch (restL^) {
    | [x, ...rest] => {
      restL := rest;
      Some(x)
    }
    | [] => None
    }
  });
};

let fromArray = (a, sink) => {
  let size = Array.length(a);
  let i = ref(0);

  makeTrampoline(sink, [@bs] () => {
    if (i^ < size) {
      let res = Some(Array.unsafe_get(a, i^));
      i := i^ + 1;
      res
    } else {
      None
    }
  });
};

let map = (f, source, sink) =>
  source(signal => sink(
    switch (signal) {
    | Start(x) => Start(x)
    | Push(x) => Push(f(x))
    | End => End
    }
  ));

let filter = (f, source, sink) =>
  captureTalkback(source, [@bs] (signal, talkback) => {
    switch (signal) {
    | Push(x) when !f(x) => talkback(Pull)
    | _ => sink(signal)
    }
  });

let scan = (f, seed, source, sink) => {
  let acc = ref(seed);

  source(signal => sink(
    switch (signal) {
    | Push(x) => {
      acc := f(acc^, x);
      Push(acc^)
    }
    | Start(x) => Start(x)
    | End => End
    }
  ));
};

type mergeStateT = {
  mutable started: int,
  mutable ended: int
};

let merge = (sources, sink) => {
  let noop = (_: talkbackT) => ();
  let size = Array.length(sources);
  let talkbacks = Array.map((_) => noop, sources);

  let state: mergeStateT = {
    started: 0,
    ended: 0
  };

  let talkback = signal => {
    let rec loopTalkbacks = (i: int) =>
      if (i < size) {
        Array.unsafe_get(talkbacks, i)(signal);
        loopTalkbacks(i + 1);
      };

    loopTalkbacks(0);
  };

  let rec loopSources = (i: int) =>
    if (i < size) {
      let source = Array.unsafe_get(sources, i);
      source(signal => {
        switch (signal) {
        | Start(tb) => {
          Array.unsafe_set(talkbacks, i, tb);
          state.started = state.started + 1;
          if (state.started === size) sink(Start(talkback));
        }
        | End => {
          state.ended = state.ended + 1;
          if (state.ended === size) sink(End);
        }
        | Push(_) => sink(signal)
        }
      });

      loopSources(i + 1);
    };

  loopSources(0);
};

type shareStateT('a) = {
  sinks: Hashtbl.t(int, signalT('a) => unit),
  mutable idCounter: int,
  mutable talkback: talkbackT => unit,
  mutable ended: bool,
  mutable gotSignal: bool
};

let share = source => {
  let state = {
    sinks: Hashtbl.create(10),
    idCounter: 0,
    talkback: (_: talkbackT) => (),
    ended: false,
    gotSignal: false
  };

  sink => {
    let id = state.idCounter;
    Hashtbl.add(state.sinks, id, sink);
    state.idCounter = state.idCounter + 1;

    if (id === 0) {
      source(signal => {
        switch (signal) {
        | Push(_) when !state.ended => {
          state.gotSignal = false;
          Hashtbl.iter((_, sink) => sink(signal), state.sinks);
        }
        | Start(x) => state.talkback = x
        | End => state.ended = true
        | _ => ()
        }
      });
    };

    sink(Start(signal => {
      switch (signal) {
      | End => {
        Hashtbl.remove(state.sinks, id);
        if (Hashtbl.length(state.sinks) === 0) {
          state.ended = true;
          state.talkback(End);
        };
      }
      | Pull when !state.gotSignal => {
        state.gotSignal = true;
        state.talkback(signal);
      }
      | Pull => ()
      }
    }));
  }
};

type combineLatestStateT('a, 'b) = {
  mutable talkbackA: talkbackT => unit,
  mutable talkbackB: talkbackT => unit,
  mutable lastValA: option('a),
  mutable lastValB: option('b),
  mutable gotSignal: bool,
  mutable endCounter: int,
  mutable ended: bool,
};

let combine = (sourceA, sourceB, sink) => {
  let state = {
    talkbackA: (_: talkbackT) => (),
    talkbackB: (_: talkbackT) => (),
    lastValA: None,
    lastValB: None,
    gotSignal: false,
    endCounter: 0,
    ended: false
  };

  sourceA(signal => {
    switch (signal, state.lastValB) {
    | (Start(tb), _) => state.talkbackA = tb
    | (Push(a), None) => state.lastValA = Some(a)
    | (Push(a), Some(b)) when !state.ended => {
      state.lastValA = Some(a);
      state.gotSignal = false;
      sink(Push((a, b)));
    }
    | (End, _) when state.endCounter < 2 => state.endCounter = state.endCounter + 1
    | (End, _) => sink(End)
    | _ => ()
    }
  });

  sourceB(signal => {
    switch (signal, state.lastValA) {
    | (Start(tb), _) => state.talkbackB = tb
    | (Push(b), None) => state.lastValB = Some(b)
    | (Push(b), Some(a)) when !state.ended => {
      state.lastValB = Some(b);
      state.gotSignal = false;
      sink(Push((a, b)));
    }
    | (End, _) when state.endCounter < 2 =>
      state.endCounter = state.endCounter + 1
    | (End, _) => sink(End)
    | _ => ()
    }
  });

  sink(Start(signal => {
    switch (signal) {
    | End => {
      state.ended = true;
      state.talkbackA(End);
      state.talkbackB(End);
    }
    | Pull when !state.gotSignal => {
      state.gotSignal = true;
      state.talkbackA(signal);
      state.talkbackB(signal);
    }
    | Pull => ()
    }
  }));
};

let take = (max, source, sink) => {
  let taken = ref(0);
  let talkback = ref((_: talkbackT) => ());

  source(signal => {
    switch (signal) {
    | Start(tb) => {
      talkback := tb;
      sink(Start(signal => {
        if (taken^ < max) tb(signal);
      }));
    }
    | Push(_) when taken^ < max => {
      taken := taken^ + 1;
      sink(signal);

      if (taken^ === max) {
        sink(End);
        talkback^(End);
      };
    }
    | End => sink(End)
    | _ => ()
    }
  });
};

let forEach = (f, source) =>
  captureTalkback(source, [@bs] (signal, talkback) => {
    switch (signal) {
    | Start(_) => talkback(Pull)
    | Push(x) => {
      f(x);
      talkback(Pull);
    }
    | End => ()
    }
  });

let subscribe = (f, source) => {
  let talkback = ref((_: talkbackT) => ());
  let ended = ref(false);

  source(signal => {
    switch (signal) {
    | Start(x) => {
      talkback := x;
      talkback^(Pull);
    }
    | Push(x) when !ended^ => {
      f(x);
      talkback^(Pull);
    }
    | _ => ()
    }
  });

  () => if (!ended^) {
    ended := true;
    talkback^(End);
  }
};
