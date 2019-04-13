open Wonka_types;

let onPush = f =>
  curry(source =>
    curry(sink =>
      source((. signal) => {
        switch (signal) {
        | Push(x) => f(. x)
        | _ => ()
        };

        sink(. signal);
      })
    )
  );

let tap = onPush;
