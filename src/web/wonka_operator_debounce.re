open Wonka_types;

let debounce = f =>
  curry(source =>
    curry(sink => {
      let gotEndSignal = ref(false);
      let id: ref(option(Js.Global.timeoutId)) = ref(None);

      let clearTimeout = () =>
        switch (id^) {
        | Some(timeoutId) =>
          id := None;
          Js.Global.clearTimeout(timeoutId);
        | None => ()
        };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Close =>
                  clearTimeout();
                  tb(. Close);
                | _ => tb(. signal)
                },
            ),
          )
        | Push(x) =>
          clearTimeout();
          id :=
            Some(
              Js.Global.setTimeout(
                () => {
                  id := None;
                  sink(. signal);
                  if (gotEndSignal^) {
                    sink(. End);
                  };
                },
                f(. x),
              ),
            );
        | End =>
          gotEndSignal := true;

          switch (id^) {
          | None => sink(. End)
          | _ => ()
          };
        }
      );
    })
  );
