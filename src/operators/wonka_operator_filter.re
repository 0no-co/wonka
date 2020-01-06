open Wonka_types;
open Wonka_helpers;

[@genType]
let filter = (f: (. 'a) => bool): operatorT('a, 'a) =>
  curry(source =>
    curry(sink =>
      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Push(x) when !f(. x) => talkback(. Pull)
        | _ => sink(. signal)
        }
      )
    )
  );
