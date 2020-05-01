open Wonka_types;

let talkbackPlaceholder = (. _: talkbackT) => ();

type trampolineT = {
  mutable ended: bool,
  mutable looping: bool,
  mutable pulled: bool,
};

let makeTrampoline = (sink: sinkT('a), f: (. unit) => option('a)) => {
  let state: trampolineT = {ended: false, looping: false, pulled: false};

  sink(.
    Start(
      (. signal) =>
        switch (signal, state.looping) {
        | (Pull, false) =>
          state.pulled = true;
          state.looping = true;

          while (state.pulled && !state.ended) {
            switch (f(.)) {
            | Some(x) =>
              state.pulled = false;
              sink(. Push(x));
            | None =>
              state.ended = true;
              sink(. End);
            };
          };

          state.looping = false;
        | (Pull, true) => state.pulled = true
        | (Close, _) => state.ended = true
        },
    ),
  );
};
