open Wonka_types;
open Wonka_helpers;

type publishStateT = {
  mutable talkback: (. talkbackT) => unit,
  mutable ended: bool,
};

let publish = source => {
  let state: publishStateT = {talkback: talkbackPlaceholder, ended: false};

  source((. signal) =>
    switch (signal) {
    | Start(x) =>
      state.talkback = x;
      x(. Pull);
    | Push(_) =>
      if (!state.ended) {
        state.talkback(. Pull);
      }
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
};
