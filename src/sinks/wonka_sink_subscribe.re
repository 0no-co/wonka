open Wonka_types;
open Wonka_helpers;

type subscribeStateT = {
  mutable talkback: (. talkbackT) => unit,
  mutable ended: bool,
};

let subscribe = f =>
  curry(source => {
    let state: subscribeStateT = {
      talkback: talkbackPlaceholder,
      ended: false,
    };

    source((. signal) =>
      switch (signal) {
      | Start(x) =>
        state.talkback = x;
        x(. Pull);
      | Push(x) when !state.ended =>
        f(. x);
        state.talkback(. Pull);
      | Push(_) => ()
      | End => state.ended = true
      }
    );

    {
      unsubscribe: () =>
        if (!state.ended) {
          state.ended = true;
          state.talkback(. Close);
        },
    };
  });

let forEach = f => curry(source => ignore(subscribe(f, source)));
