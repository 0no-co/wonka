open Callbag_types;

let captureTalkback = (source: (signalT('a) => unit) => unit, sinkWithTalkback: [@bs] (signalT('a), talkbackT => unit) => unit) => {
  let talkback = ref((_: talkbackT) => ());

  source(signal => {
    switch (signal) {
    | Start(x) => talkback := x
    | _ => ()
    };

    [@bs] sinkWithTalkback(signal, talkback^)
  });
};

type trampolineT = {
  mutable exhausted: bool,
  mutable inLoop: bool,
  mutable gotSignal: bool
};

let makeTrampoline = (sink: signalT('a) => unit, f: [@bs] unit => option('a)) => {
  let state: trampolineT = {
    exhausted: false,
    inLoop: false,
    gotSignal: false
  };

  let loop = () => {
    let rec explode = () =>
      switch ([@bs] f()) {
      | Some(x) => {
        sink(Push(x));
        if (state.gotSignal) explode();
      }
      | None => {
        state.exhausted = true;
        sink(End)
      }
      };

    state.inLoop = true;
    explode();
    state.inLoop = false;
  };

  sink(Start(signal => {
    switch (signal, state.exhausted) {
    | (Pull, false) => {
      state.gotSignal = true;
      if (!state.inLoop) loop();
    }
    | _ => ()
    }
  }));
};
