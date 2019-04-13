open Wonka_types;
open Wonka_helpers;

let skip = wait =>
  curry(source =>
    curry(sink => {
      let rest = ref(wait);

      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Push(_) when rest^ > 0 =>
          rest := rest^ - 1;
          talkback(. Pull);
        | _ => sink(. signal)
        }
      );
    })
  );
