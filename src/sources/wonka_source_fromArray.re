open Wonka_types;

type fromArrayState('a) = {
  mutable index: int,
  mutable ended: bool,
  mutable looping: bool,
  mutable pull: bool
};

let fromArray = arr => curry(sink => {
  let size = Rebel.Array.size(arr);
  let state = {
    index: 0,
    ended: false,
    looping: false,
    pull: false
  };

  sink(.Start((.signal) => {
    switch (signal, state.looping) {
    | (Pull, false) => {
      state.pull = true;
      state.looping = true;

      while (state.pull && !state.ended) {
        let index = state.index;
        if (index < size) {
          let x = Rebel.Array.getUnsafe(arr, index);
          state.index = index + 1;
          state.pull = false;
          sink(.Push(x));
        } else {
          state.ended = true;
          sink(.End);
        }
      };

      state.looping = false;
    }
    | (Pull, true) => state.pull = true
    | (Close, _) => state.ended = true
    }
  }));
});
