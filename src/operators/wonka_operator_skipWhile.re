open Wonka_types;
open Wonka_helpers;

[@genType]
let skipWhile = (f: (. 'a) => bool): operatorT('a, 'a) =>
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
