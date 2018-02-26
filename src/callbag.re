open Callbag_types;
open Callbag_helpers;

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
