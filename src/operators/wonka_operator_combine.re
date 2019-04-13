open Wonka_types;
open Wonka_helpers;

type combineStateT('a, 'b) = {
  mutable talkbackA: (. talkbackT) => unit,
  mutable talkbackB: (. talkbackT) => unit,
  mutable lastValA: option('a),
  mutable lastValB: option('b),
  mutable gotSignal: bool,
  mutable endCounter: int,
  mutable ended: bool,
};

let combine = sourceA =>
  curry(sourceB =>
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
    })
  );
