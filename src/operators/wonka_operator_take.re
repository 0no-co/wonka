open Wonka_types;
open Wonka_helpers;

type takeStateT = {
  mutable taken: int,
  mutable talkback: (. talkbackT) => unit,
};

let take = max =>
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
