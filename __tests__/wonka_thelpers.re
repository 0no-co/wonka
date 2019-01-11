open Wonka_types;

let testWithListenable = operator => {
  let sink = ref((._: signalT(int)) => ());
  let signals = [||];
  let source = x => {
    sink := x;
    x(.Start((.signal) => {
      ignore(Js.Array.push(signal, signals))
    }));
  };

  let talkback = ref((._: talkbackT) => ());
  let res = [||];
  operator(source)((.signal) => {
    switch (signal) {
    | Start(x) => talkback := x
    | _ => ignore(Js.Array.push(signal, res))
    }
  });

  Js.Promise.make((~resolve, ~reject as _) => {
    sink^(.Push(1));
    ignore(Js.Global.setTimeout(() => {
      sink^(.Push(2));
      ignore(Js.Global.setTimeout(() => {
        sink^(.End);
        ignore(Js.Global.setTimeout(() => {
          resolve(.(signals, res));
        }, 0));
      }, 0));
    }, 0));
  })
};

let testTalkbackEnd = operator => {
  let sink = ref((._: signalT(int)) => ());
  let signals: array(talkbackT) = [||];
  let source = x => {
    x(.Start((.signal) => ignore(Js.Array.push(signal, signals))));
    sink := x;
  };

  let talkback = ref((._: talkbackT) => ());
  let res = [||];
  operator(source)((.signal) => {
    switch (signal) {
    | Start(x) => talkback := x
    | _ => ignore(Js.Array.push(signal, res))
    }
  });

  Js.Promise.make((~resolve, ~reject as _) => {
    sink^(.Push(1));
    ignore(Js.Global.setTimeout(() => {
      talkback^(.Close);
      ignore(Js.Global.setTimeout(() => {
        resolve(.(signals, res));
      }, 0));
    }, 0));
  })
};
