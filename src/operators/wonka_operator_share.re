open Wonka_types;
open Wonka_helpers;

type shareStateT('a) = {
  mutable sinks: Rebel.Array.t(sinkT('a)),
  mutable talkback: (. talkbackT) => unit,
  mutable gotSignal: bool,
};

let share = source => {
  let state = {
    sinks: Rebel.Array.makeEmpty(),
    talkback: talkbackPlaceholder,
    gotSignal: false,
  };

  sink => {
    state.sinks = Rebel.Array.append(state.sinks, sink);

    if (Rebel.Array.size(state.sinks) === 1) {
      source((. signal) =>
        switch (signal) {
        | Push(_) =>
          state.gotSignal = false;
          Rebel.Array.forEach(state.sinks, sink => sink(. signal));
        | Start(x) => state.talkback = x
        | End =>
          Rebel.Array.forEach(state.sinks, sink => sink(. End));
          state.sinks = Rebel.Array.makeEmpty();
        }
      );
    };

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close =>
            state.sinks = Rebel.Array.filter(state.sinks, x => x !== sink);
            if (Rebel.Array.size(state.sinks) === 0) {
              state.talkback(. Close);
            };
          | Pull when !state.gotSignal =>
            state.gotSignal = true;
            state.talkback(. signal);
          | Pull => ()
          },
      ),
    );
  };
};
