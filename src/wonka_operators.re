open Wonka_types;
open Wonka_helpers;

type bufferStateT('a) = {
  mutable buffer: Rebel.MutableQueue.t('a),
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
  mutable ended: bool,
};

[@genType]
let buffer = (notifier: sourceT('a)): operatorT('b, array('b)) =>
  curry(source =>
    curry(sink => {
      let state = {
        buffer: Rebel.MutableQueue.make(),
        sourceTalkback: talkbackPlaceholder,
        notifierTalkback: talkbackPlaceholder,
        ended: false,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          state.sourceTalkback = tb;

          notifier((. signal) =>
            switch (signal) {
            | Start(tb) =>
              state.notifierTalkback = tb;
              state.notifierTalkback(. Pull);
            | Push(_) when !state.ended =>
              sink(. Push(Rebel.MutableQueue.toArray(state.buffer)));
              state.buffer = Rebel.MutableQueue.make();
              state.notifierTalkback(. Pull);
            | Push(_) => ()
            | End when !state.ended =>
              state.ended = true;
              state.sourceTalkback(. Close);
              sink(. Push(Rebel.MutableQueue.toArray(state.buffer)));
              sink(. End);
            | End => ()
            }
          );
        | Push(value) when !state.ended =>
          Rebel.MutableQueue.add(state.buffer, value);
          state.sourceTalkback(. Pull);
        | Push(_) => ()
        | End when !state.ended =>
          state.ended = true;
          state.notifierTalkback(. Close);
          sink(. Push(Rebel.MutableQueue.toArray(state.buffer)));
          sink(. End);
        | End => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (!state.ended) {
              switch (signal) {
              | Close =>
                state.ended = true;
                state.sourceTalkback(. Close);
                state.notifierTalkback(. Close);
              | Pull => state.sourceTalkback(. Pull)
              };
            },
        ),
      );
    })
  );

type combineStateT('a, 'b) = {
  mutable talkbackA: (. talkbackT) => unit,
  mutable talkbackB: (. talkbackT) => unit,
  mutable lastValA: option('a),
  mutable lastValB: option('b),
  mutable gotSignal: bool,
  mutable endCounter: int,
  mutable ended: bool,
};

[@genType]
let combine =
    (sourceA: sourceT('a), sourceB: sourceT('b)): sourceT(('a, 'b)) =>
  curry(sink => {
    let state = {
      talkbackA: talkbackPlaceholder,
      talkbackB: talkbackPlaceholder,
      lastValA: None,
      lastValB: None,
      gotSignal: false,
      endCounter: 0,
      ended: false,
    };

    sourceA((. signal) =>
      switch (signal, state.lastValB) {
      | (Start(tb), _) => state.talkbackA = tb
      | (Push(a), None) =>
        state.lastValA = Some(a);
        state.gotSignal = false;
      | (Push(a), Some(b)) when !state.ended =>
        state.lastValA = Some(a);
        state.gotSignal = false;
        sink(. Push((a, b)));
      | (End, _) when state.endCounter < 1 =>
        state.endCounter = state.endCounter + 1
      | (End, _) when !state.ended =>
        state.ended = true;
        sink(. End);
      | _ => ()
      }
    );

    sourceB((. signal) =>
      switch (signal, state.lastValA) {
      | (Start(tb), _) => state.talkbackB = tb
      | (Push(b), None) =>
        state.lastValB = Some(b);
        state.gotSignal = false;
      | (Push(b), Some(a)) when !state.ended =>
        state.lastValB = Some(b);
        state.gotSignal = false;
        sink(. Push((a, b)));
      | (End, _) when state.endCounter < 1 =>
        state.endCounter = state.endCounter + 1
      | (End, _) when !state.ended =>
        state.ended = true;
        sink(. End);
      | _ => ()
      }
    );

    sink(.
      Start(
        (. signal) =>
          if (!state.ended) {
            switch (signal) {
            | Close =>
              state.ended = true;
              state.talkbackA(. Close);
              state.talkbackB(. Close);
            | Pull when !state.gotSignal =>
              state.gotSignal = true;
              state.talkbackA(. signal);
              state.talkbackB(. signal);
            | Pull => ()
            };
          },
      ),
    );
  });

type concatMapStateT('a) = {
  inputQueue: Rebel.MutableQueue.t('a),
  mutable outerTalkback: (. talkbackT) => unit,
  mutable innerTalkback: (. talkbackT) => unit,
  mutable innerActive: bool,
  mutable closed: bool,
  mutable ended: bool,
};

[@genType]
let concatMap = (f: (. 'a) => sourceT('b)): operatorT('a, 'b) =>
  curry(source =>
    curry(sink => {
      let state: concatMapStateT('a) = {
        inputQueue: Rebel.MutableQueue.make(),
        outerTalkback: talkbackPlaceholder,
        innerTalkback: talkbackPlaceholder,
        innerActive: false,
        closed: false,
        ended: false,
      };

      let rec applyInnerSource = innerSource =>
        innerSource((. signal) =>
          switch (signal) {
          | End =>
            state.innerActive = false;
            state.innerTalkback = talkbackPlaceholder;

            switch (Rebel.MutableQueue.pop(state.inputQueue)) {
            | Some(input) => applyInnerSource(f(. input))
            | None when state.ended => sink(. End)
            | None => ()
            };
          | Start(tb) =>
            state.innerActive = true;
            state.innerTalkback = tb;
            tb(. Pull);
          | Push(x) when !state.closed =>
            sink(. Push(x));
            state.innerTalkback(. Pull);
          | Push(_) => ()
          }
        );

      source((. signal) =>
        switch (signal) {
        | End when !state.ended =>
          state.ended = true;
          if (!state.innerActive
              && Rebel.MutableQueue.isEmpty(state.inputQueue)) {
            sink(. End);
          };
        | End => ()
        | Start(tb) =>
          state.outerTalkback = tb;
          tb(. Pull);
        | Push(x) when !state.ended =>
          if (state.innerActive) {
            Rebel.MutableQueue.add(state.inputQueue, x);
          } else {
            applyInnerSource(f(. x));
          };

          state.outerTalkback(. Pull);
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Pull =>
              if (!state.ended) {
                state.innerTalkback(. Pull);
              }
            | Close =>
              state.innerTalkback(. Close);
              if (!state.ended) {
                state.ended = true;
                state.closed = true;
                state.outerTalkback(. Close);
                state.innerTalkback = talkbackPlaceholder;
              };
            },
        ),
      );
    })
  );

[@genType]
let concatAll = (source: sourceT(sourceT('a))): sourceT('a) =>
  concatMap((. x) => x, source);

[@genType]
let concat = (sources: array(sourceT('a))): sourceT('a) =>
  concatMap((. x) => x, Wonka_sources.fromArray(sources));

[@genType]
let filter = (f: (. 'a) => bool): operatorT('a, 'a) =>
  curry(source =>
    curry(sink =>
      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Push(x) when !f(. x) => talkback(. Pull)
        | _ => sink(. signal)
        }
      )
    )
  );

[@genType]
let map = (f: (. 'a) => 'b): operatorT('a, 'b) =>
  curry(source =>
    curry(sink =>
      source((. signal) =>
        sink(.
          switch (signal) {
          | Start(x) => Start(x)
          | Push(x) => Push(f(. x))
          | End => End
          },
        )
      )
    )
  );

type mergeMapStateT = {
  mutable outerTalkback: (. talkbackT) => unit,
  mutable innerTalkbacks: Rebel.Array.t((. talkbackT) => unit),
  mutable ended: bool,
};

[@genType]
let mergeMap = (f: (. 'a) => sourceT('b)): operatorT('a, 'b) =>
  curry(source =>
    curry(sink => {
      let state: mergeMapStateT = {
        outerTalkback: talkbackPlaceholder,
        innerTalkbacks: Rebel.Array.makeEmpty(),
        ended: false,
      };

      let applyInnerSource = innerSource => {
        let talkback = ref(talkbackPlaceholder);

        innerSource((. signal) =>
          switch (signal) {
          | End =>
            state.innerTalkbacks =
              Rebel.Array.filter(state.innerTalkbacks, x => x !== talkback^);
            if (state.ended && Rebel.Array.size(state.innerTalkbacks) === 0) {
              sink(. End);
            };
          | Start(tb) =>
            talkback := tb;
            state.innerTalkbacks =
              Rebel.Array.append(state.innerTalkbacks, tb);
            tb(. Pull);
          | Push(x) when Rebel.Array.size(state.innerTalkbacks) !== 0 =>
            sink(. Push(x));
            talkback^(. Pull);
          | Push(_) => ()
          }
        );
      };

      source((. signal) =>
        switch (signal) {
        | End when !state.ended =>
          state.ended = true;
          if (Rebel.Array.size(state.innerTalkbacks) === 0) {
            sink(. End);
          };
        | End => ()
        | Start(tb) =>
          state.outerTalkback = tb;
          tb(. Pull);
        | Push(x) when !state.ended =>
          applyInnerSource(f(. x));
          state.outerTalkback(. Pull);
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close =>
              Rebel.Array.forEach(state.innerTalkbacks, talkback =>
                talkback(. Close)
              );
              if (!state.ended) {
                state.ended = true;
                state.outerTalkback(. Close);
                Rebel.Array.forEach(state.innerTalkbacks, talkback =>
                  talkback(. Close)
                );
                state.innerTalkbacks = Rebel.Array.makeEmpty();
              };
            | Pull when !state.ended =>
              Rebel.Array.forEach(state.innerTalkbacks, talkback =>
                talkback(. Pull)
              )
            | Pull => ()
            },
        ),
      );
    })
  );

[@genType]
let merge = (sources: array(sourceT('a))): sourceT('a) =>
  mergeMap((. x) => x, Wonka_sources.fromArray(sources));

[@genType]
let mergeAll = (source: sourceT(sourceT('a))): sourceT('a) =>
  mergeMap((. x) => x, source);

[@genType]
let flatten = mergeAll;

[@genType]
let onEnd = (f: (. unit) => unit): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let ended = ref(false);

      source((. signal) =>
        switch (signal) {
        | Start(talkback) =>
          sink(.
            Start(
              (. signal) => {
                switch (signal) {
                | Close when ! ended^ =>
                  ended := true;
                  f(.);
                | Close
                | Pull => ()
                };

                talkback(. signal);
              },
            ),
          )
        | End =>
          if (! ended^) {
            ended := true;
            sink(. signal);
            f(.);
          }
        | _ => sink(. signal)
        }
      );
    })
  );

[@genType]
let onPush = (f: (. 'a) => unit): operatorT('a, 'a) =>
  curry(source =>
    curry(sink =>
      source((. signal) => {
        switch (signal) {
        | Push(x) => f(. x)
        | _ => ()
        };

        sink(. signal);
      })
    )
  );

[@genType]
let tap = onPush;

[@genType]
let onStart = (f: (. unit) => unit): operatorT('a, 'a) =>
  curry(source =>
    curry(sink =>
      source((. signal) =>
        switch (signal) {
        | Start(_) =>
          sink(. signal);
          f(.);
        | _ => sink(. signal)
        }
      )
    )
  );

type sampleStateT('a) = {
  mutable ended: bool,
  mutable value: option('a),
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
};

[@genType]
let sample = (notifier: sourceT('a)): operatorT('b, 'b) =>
  curry(source =>
    curry(sink => {
      let state = {
        ended: false,
        value: None,
        sourceTalkback: (. _: talkbackT) => (),
        notifierTalkback: (. _: talkbackT) => (),
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) => state.sourceTalkback = tb
        | End =>
          state.ended = true;
          state.notifierTalkback(. Close);
          sink(. End);
        | Push(x) => state.value = Some(x)
        }
      );

      notifier((. signal) =>
        switch (signal, state.value) {
        | (Start(tb), _) => state.notifierTalkback = tb
        | (End, _) =>
          state.ended = true;
          state.sourceTalkback(. Close);
          sink(. End);
        | (Push(_), Some(x)) when !state.ended =>
          state.value = None;
          sink(. Push(x));
        | (Push(_), _) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Pull =>
              state.sourceTalkback(. Pull);
              state.notifierTalkback(. Pull);
            | Close =>
              state.ended = true;
              state.sourceTalkback(. Close);
              state.notifierTalkback(. Close);
            },
        ),
      );
    })
  );

[@genType]
let scan = (f: (. 'acc, 'a) => 'acc, seed: 'acc): operatorT('a, 'acc) =>
  curry(source =>
    curry(sink => {
      let acc = ref(seed);

      source((. signal) =>
        sink(.
          switch (signal) {
          | Push(x) =>
            acc := f(. acc^, x);
            Push(acc^);
          | Start(x) => Start(x)
          | End => End
          },
        )
      );
    })
  );

type shareStateT('a) = {
  mutable sinks: Rebel.Array.t(sinkT('a)),
  mutable talkback: (. talkbackT) => unit,
  mutable gotSignal: bool,
};

[@genType]
let share = (source: sourceT('a)): sourceT('a) => {
  let state = {
    sinks: Rebel.Array.makeEmpty(),
    talkback: talkbackPlaceholder,
    gotSignal: false,
  };

  sink => {
    state.sinks = Rebel.Array.append(state.sinks, sink);

    if (Rebel.Array.size(state.sinks) === 1) {
      source((. signal) =>
        switch (signal) {
        | Push(_) =>
          state.gotSignal = false;
          Rebel.Array.forEach(state.sinks, sink => sink(. signal));
        | Start(x) => state.talkback = x
        | End =>
          Rebel.Array.forEach(state.sinks, sink => sink(. End));
          state.sinks = Rebel.Array.makeEmpty();
        }
      );
    };

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close =>
            state.sinks = Rebel.Array.filter(state.sinks, x => x !== sink);
            if (Rebel.Array.size(state.sinks) === 0) {
              state.talkback(. Close);
            };
          | Pull when !state.gotSignal =>
            state.gotSignal = true;
            state.talkback(. signal);
          | Pull => ()
          },
      ),
    );
  };
};

[@genType]
let skip = (wait: int): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let rest = ref(wait);

      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Push(_) when rest^ > 0 =>
          rest := rest^ - 1;
          talkback(. Pull);
        | _ => sink(. signal)
        }
      );
    })
  );

type skipUntilStateT = {
  mutable skip: bool,
  mutable ended: bool,
  mutable gotSignal: bool,
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
};

[@genType]
let skipUntil = (notifier: sourceT('a)): operatorT('b, 'b) =>
  curry(source =>
    curry(sink => {
      let state: skipUntilStateT = {
        skip: true,
        ended: false,
        gotSignal: false,
        sourceTalkback: talkbackPlaceholder,
        notifierTalkback: talkbackPlaceholder,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          state.sourceTalkback = tb;

          notifier((. signal) =>
            switch (signal) {
            | Start(innerTb) =>
              state.notifierTalkback = innerTb;
              innerTb(. Pull);
              tb(. Pull);
            | Push(_) =>
              state.skip = false;
              state.notifierTalkback(. Close);
            | End => ()
            }
          );
        | Push(_) when state.skip && !state.ended =>
          state.sourceTalkback(. Pull)
        | Push(_) when !state.ended =>
          state.gotSignal = false;
          sink(. signal);
        | Push(_) => ()
        | End =>
          if (state.skip) {
            state.notifierTalkback(. Close);
          };
          state.ended = true;
          sink(. End);
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close =>
              if (state.skip) {
                state.notifierTalkback(. Close);
              };
              state.ended = true;
              state.sourceTalkback(. Close);
            | Pull when !state.gotSignal && !state.ended =>
              state.gotSignal = true;
              state.sourceTalkback(. Pull);
            | Pull => ()
            },
        ),
      );
    })
  );

[@genType]
let skipWhile = (f: (. 'a) => bool): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let skip = ref(true);

      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Push(x) when skip^ =>
          if (f(. x)) {
            talkback(. Pull);
          } else {
            skip := false;
            sink(. signal);
          }
        | _ => sink(. signal)
        }
      );
    })
  );

type switchMapStateT('a) = {
  mutable outerTalkback: (. talkbackT) => unit,
  mutable outerPulled: bool,
  mutable innerTalkback: (. talkbackT) => unit,
  mutable innerActive: bool,
  mutable innerPulled: bool,
  mutable ended: bool,
};

[@genType]
let switchMap = (f: (. 'a) => sourceT('b)): operatorT('a, 'b) =>
  curry(source =>
    curry(sink => {
      let state: switchMapStateT('a) = {
        outerTalkback: talkbackPlaceholder,
        outerPulled: false,
        innerTalkback: talkbackPlaceholder,
        innerActive: false,
        innerPulled: false,
        ended: false,
      };

      let applyInnerSource = innerSource =>
        innerSource((. signal) =>
          switch (signal) {
          | Start(tb) =>
            state.innerActive = true;
            state.innerTalkback = tb;
            state.innerPulled = false;
            tb(. Pull);
          | Push(_) when state.innerActive =>
            sink(. signal);
            if (!state.innerPulled) {
              state.innerTalkback(. Pull);
            } else {
              state.innerPulled = false;
            };
          | Push(_) => ()
          | End when state.innerActive =>
            state.innerActive = false;
            if (state.ended) {
              sink(. signal);
            };
          | End => ()
          }
        );

      source((. signal) =>
        switch (signal) {
        | Start(tb) => state.outerTalkback = tb
        | Push(x) when !state.ended =>
          if (state.innerActive) {
            state.innerTalkback(. Close);
            state.innerTalkback = talkbackPlaceholder;
          };

          if (!state.outerPulled) {
            state.outerPulled = true;
            state.outerTalkback(. Pull);
          } else {
            state.outerPulled = false;
          };

          applyInnerSource(f(. x));
        | Push(_) => ()
        | End when !state.ended =>
          state.ended = true;
          if (!state.innerActive) {
            sink(. End);
          };
        | End => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Pull =>
              if (!state.ended && !state.outerPulled) {
                state.outerPulled = true;
                state.outerTalkback(. Pull);
              };
              if (state.innerActive && !state.innerPulled) {
                state.innerPulled = true;
                state.innerTalkback(. Pull);
              };
            | Close when !state.ended =>
              state.ended = true;
              state.innerActive = false;
              state.innerTalkback(. Close);
              state.outerTalkback(. Close);
            | Close => ()
            },
        ),
      );
    })
  );

[@genType]
let switchAll = (source: sourceT(sourceT('a))): sourceT('a) =>
  switchMap((. x) => x, source);

type takeStateT = {
  mutable taken: int,
  mutable talkback: (. talkbackT) => unit,
};

[@genType]
let take = (max: int): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let state: takeStateT = {taken: 0, talkback: talkbackPlaceholder};

      source((. signal) =>
        switch (signal) {
        | Start(tb) => state.talkback = tb
        | Push(_) when state.taken < max =>
          state.taken = state.taken + 1;
          sink(. signal);

          if (state.taken === max) {
            sink(. End);
            state.talkback(. Close);
          };
        | Push(_) => ()
        | End when state.taken < max =>
          state.taken = max;
          sink(. End);
        | End => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (state.taken < max) {
              switch (signal) {
              | Pull => state.talkback(. Pull)
              | Close =>
                state.taken = max;
                state.talkback(. Close);
              };
            },
        ),
      );
    })
  );

[@genType]
let takeLast = (max: int): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      open Rebel;
      let queue = MutableQueue.make();

      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Start(_) => talkback(. Pull)
        | Push(x) =>
          let size = MutableQueue.size(queue);
          if (size >= max && max > 0) {
            ignore(MutableQueue.pop(queue));
          };

          MutableQueue.add(queue, x);
          talkback(. Pull);
        | End => makeTrampoline(sink, (.) => MutableQueue.pop(queue))
        }
      );
    })
  );

type takeUntilStateT = {
  mutable ended: bool,
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
};

[@genType]
let takeUntil = (notifier: sourceT('a)): operatorT('b, 'b) =>
  curry(source =>
    curry(sink => {
      let state: takeUntilStateT = {
        ended: false,
        sourceTalkback: talkbackPlaceholder,
        notifierTalkback: talkbackPlaceholder,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          state.sourceTalkback = tb;

          notifier((. signal) =>
            switch (signal) {
            | Start(innerTb) =>
              state.notifierTalkback = innerTb;
              innerTb(. Pull);
            | Push(_) =>
              state.ended = true;
              state.sourceTalkback(. Close);
              sink(. End);
            | End => ()
            }
          );
        | End when !state.ended =>
          state.ended = true;
          state.notifierTalkback(. Close);
          sink(. End);
        | End => ()
        | Push(_) when !state.ended => sink(. signal)
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (!state.ended) {
              switch (signal) {
              | Close =>
                state.ended = true;
                state.sourceTalkback(. Close);
                state.notifierTalkback(. Close);
              | Pull => state.sourceTalkback(. Pull)
              };
            },
        ),
      );
    })
  );

[@genType]
let takeWhile = (f: (. 'a) => bool): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let ended = ref(false);
      let talkback = ref(talkbackPlaceholder);

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          talkback := tb;
          sink(. signal);
        | End when ! ended^ =>
          ended := true;
          sink(. End);
        | End => ()
        | Push(x) when ! ended^ =>
          if (!f(. x)) {
            ended := true;
            sink(. End);
            talkback^(. Close);
          } else {
            sink(. signal);
          }
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (! ended^) {
              switch (signal) {
              | Pull => talkback^(. Pull)
              | Close =>
                ended := true;
                talkback^(. Close);
              };
            },
        ),
      );
    })
  );
