open Wonka_types;
open Wonka_helpers;

let takeWhile = f =>
  curry(source =>
    curry(sink => {
      let ended = ref(false);
      let talkback = ref(talkbackPlaceholder);

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          talkback := tb;
          sink(. signal);
        | End when ! ended^ =>
          ended := true;
          sink(. End);
        | End => ()
        | Push(x) when ! ended^ =>
          if (!f(. x)) {
            ended := true;
            sink(. End);
            talkback^(. Close);
          } else {
            sink(. signal);
          }
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (! ended^) {
              switch (signal) {
              | Pull => talkback^(. Pull)
              | Close =>
                ended := true;
                talkback^(. Close);
              };
            },
        ),
      );
    })
  );
