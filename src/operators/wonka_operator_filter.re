open Wonka_types;
open Wonka_helpers;

let filter = f =>
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
