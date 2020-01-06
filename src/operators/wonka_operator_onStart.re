open Wonka_types;

[@genType]
let onStart = (f: (. unit) => unit): operatorT('a, 'a) =>
  curry(source =>
    curry(sink =>
      source((. signal) =>
        switch (signal) {
        | Start(_) =>
          sink(. signal);
          f(.);
        | _ => sink(. signal)
        }
      )
    )
  );
