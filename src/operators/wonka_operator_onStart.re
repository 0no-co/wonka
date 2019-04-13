open Wonka_types;

let onStart = f =>
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
