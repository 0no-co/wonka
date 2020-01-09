open Wonka_types;

let talkbackPlaceholder = (. _: talkbackT) => ();

type trampolineT = {
  mutable ended: bool,
  mutable looping: bool,
  mutable pull: bool,
};

let makeTrampoline = (sink: sinkT('a), f: (. unit) => option('a)) => {
  let state: trampolineT = {ended: false, looping: false, pull: false};

  sink(.
    Start(
      (. signal) =>
        switch (signal, state.looping) {
        | (Pull, false) =>
          state.pull = true;
          state.looping = true;

          while (state.pull && !state.ended) {
            switch (f(.)) {
            | Some(x) =>
              state.pull = false;
              sink(. Push(x));
            | None =>
              state.ended = true;
              sink(. End);
            };
          };

          state.looping = false;
        | (Pull, true) => state.pull = true
        | (Close, _) => state.ended = true
        },
    ),
  );
};
