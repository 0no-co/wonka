open Wonka_types;

[@genType]
let onPush = (f: (. 'a) => unit): operatorT('a, 'a) =>
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

[@genType]
let tap = onPush;
