open Wonka_types;
open Wonka_helpers;

type switchMapStateT('a) = {
  mutable outerTalkback: (. talkbackT) => unit,
  mutable innerTalkback: (. talkbackT) => unit,
  mutable innerActive: bool,
  mutable closed: bool,
  mutable ended: bool,
};

let switchMap = f =>
  curry(source =>
    curry(sink => {
      let state: switchMapStateT('a) = {
        outerTalkback: talkbackPlaceholder,
        innerTalkback: talkbackPlaceholder,
        innerActive: false,
        closed: false,
        ended: false,
      };

      let applyInnerSource = innerSource =>
        innerSource((. signal) =>
          switch (signal) {
          | End =>
            state.innerActive = false;
            state.innerTalkback = talkbackPlaceholder;
            if (state.ended) {
              sink(. End);
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
          if (!state.innerActive) {
            sink(. End);
          };
        | End => ()
        | Start(tb) =>
          state.outerTalkback = tb;
          tb(. Pull);
        | Push(x) when !state.ended =>
          if (state.innerActive) {
            state.innerTalkback(. Close);
            state.innerTalkback = talkbackPlaceholder;
          };
          applyInnerSource(f(. x));
          state.outerTalkback(. Pull);
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Pull => state.innerTalkback(. Pull)
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

let switchAll = source => switchMap((. x) => x, source);
