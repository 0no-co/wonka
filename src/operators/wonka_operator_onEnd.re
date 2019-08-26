open Wonka_types;

let onEnd = f =>
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
