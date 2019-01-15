open Wonka_types;

let tap = f => curry(source => curry(sink => {
  source((.signal) => {
    switch (signal) {
    | Push(x) => f(.x)
    | _ => ()
    };

    sink(.signal);
  });
}));
