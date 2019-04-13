open Wonka_types;

let throttle = f =>
  curry(source =>
    curry(sink => {
      let skip = ref(false);
      let id: ref(option(Js.Global.timeoutId)) = ref(None);
      let clearTimeout = () =>
        switch (id^) {
        | Some(timeoutId) => Js.Global.clearTimeout(timeoutId)
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
        | End =>
          clearTimeout();
          sink(. End);
        | Push(x) when ! skip^ =>
          skip := true;
          clearTimeout();
          id :=
            Some(
              Js.Global.setTimeout(
                () => {
                  id := None;
                  skip := false;
                },
                f(. x),
              ),
            );
          sink(. signal);
        | Push(_) => ()
        }
      );
    })
  );
