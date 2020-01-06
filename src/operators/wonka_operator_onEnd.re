open Wonka_types;

[@genType]
let onEnd = (f: (. unit) => unit): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let ended = ref(false);

      source((. signal) =>
        switch (signal) {
        | Start(talkback) =>
          sink(.
            Start(
              (. signal) => {
                switch (signal) {
                | Close when ! ended^ =>
                  ended := true;
                  f(.);
                | Close
                | Pull => ()
                };

                talkback(. signal);
              },
            ),
          )
        | End =>
          if (! ended^) {
            ended := true;
            sink(. signal);
            f(.);
          }
        | _ => sink(. signal)
        }
      );
    })
  );
