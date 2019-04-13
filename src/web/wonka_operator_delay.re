open Wonka_types;

type delayStateT = {
  mutable talkback: (. talkbackT) => unit,
  mutable active: int,
  mutable gotEndSignal: bool,
};

let delay = wait =>
  curry(source =>
    curry(sink => {
      let state: delayStateT = {
        talkback: Wonka_helpers.talkbackPlaceholder,
        active: 0,
        gotEndSignal: false,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) => state.talkback = tb
        | _ when !state.gotEndSignal =>
          state.active = state.active + 1;
          ignore(
            Js.Global.setTimeout(
              () => {
                if (state.gotEndSignal && state.active === 0) {
                  sink(. End);
                } else {
                  state.active = state.active - 1;
                };

                sink(. signal);
              },
              wait,
            ),
          );
        | _ => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close =>
              state.gotEndSignal = true;
              if (state.active === 0) {
                sink(. End);
              };
            | _ when !state.gotEndSignal => state.talkback(. signal)
            | _ => ()
            },
        ),
      );
    })
  );
