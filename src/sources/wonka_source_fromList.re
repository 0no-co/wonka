open Wonka_types;

type fromListState('a) = {
  mutable value: 'a,
  mutable ended: bool,
  mutable looping: bool,
  mutable pull: bool,
};

let fromList = ls =>
  curry(sink => {
    let state = {value: ls, ended: false, looping: false, pull: false};

    sink(.
      Start(
        (. signal) =>
          switch (signal, state.looping) {
          | (Pull, false) =>
            state.pull = true;
            state.looping = true;

            while (state.pull && !state.ended) {
              switch (state.value) {
              | [x, ...rest] =>
                state.value = rest;
                state.pull = false;
                sink(. Push(x));
              | [] =>
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
  });
