open Wonka_types;

let tapAll = (~onStart, ~onPush, ~onEnd) => {
  curry(source => curry(sink => {
    source((.signal) => {
      switch (signal) {
      | Start(_) => onStart(.)
      | Push(x) => onPush(.x)
      | End => onEnd(.)
      };

      sink(.signal);
    });
  }));
};
