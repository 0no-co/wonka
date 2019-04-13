open Wonka_types;
open Wonka_helpers;

let skipWhile = f =>
  curry(source =>
    curry(sink => {
      let skip = ref(true);

      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Push(x) when skip^ =>
          if (f(. x)) {
            talkback(. Pull);
          } else {
            skip := false;
            sink(. signal);
          }
        | _ => sink(. signal)
        }
      );
    })
  );
