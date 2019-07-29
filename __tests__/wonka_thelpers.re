open Wonka_types;

let testWithListenable = operator => {
  let sink = ref((. _: signalT(int)) => ());
  let signals = [||];
  let source = x => {
    sink := x;
    x(. Start((. signal) => ignore(Js.Array.push(signal, signals))));
  };

  let talkback = ref((. _: talkbackT) => ());
  let res = [||];
  operator(source, (. signal) =>
    switch (signal) {
    | Start(x) => talkback := x
    | _ => ignore(Js.Array.push(signal, res))
    }
  );

  Js.Promise.make((~resolve, ~reject as _) => {
    sink^(. Push(1));
    ignore(
      Js.Global.setTimeout(
        () => {
          sink^(. Push(2));
          ignore(
            Js.Global.setTimeout(
              () => {
                sink^(. End);
                ignore(
                  Js.Global.setTimeout(() => resolve(. (signals, res)), 0),
                );
              },
              0,
            ),
          );
        },
        0,
      ),
    );
  });
};

let testTalkbackEnd = operator => {
  let sink = ref((. _: signalT(int)) => ());
  let signals: array(talkbackT) = [||];
  let source = x => {
    x(. Start((. signal) => ignore(Js.Array.push(signal, signals))));
    sink := x;
  };

  let talkback = ref((. _: talkbackT) => ());
  let res = [||];
  operator(source, (. signal) =>
    switch (signal) {
    | Start(x) => talkback := x
    | _ => ignore(Js.Array.push(signal, res))
    }
  );

  Js.Promise.make((~resolve, ~reject as _) => {
    sink^(. Push(1));
    ignore(
      Js.Global.setTimeout(
        () => {
          talkback^(. Close);
          ignore(Js.Global.setTimeout(() => resolve(. (signals, res)), 0));
        },
        0,
      ),
    );
  });
};

let testSource = source => {
  let talkback = ref((. _: talkbackT) => ());
  let res = [||];

  Js.Promise.make((~resolve, ~reject as _) =>
    source((. signal) =>
      switch (signal) {
      | Start(x) =>
        talkback := x;
        talkback^(. Pull);
      | Push(_) =>
        ignore(Js.Array.push(signal, res));
        talkback^(. Pull);
      | End =>
        ignore(Js.Array.push(signal, res));
        resolve(. res);
      }
    )
  );
};

let testSourceOperator = source => {
  let res = [||];
  let innerSource = sink => {
    source((. signal) =>
      switch (signal) {
      | Start(outerTalkback) =>
        sink(.
          Start(
            (. talkback) => {
              Js.Array.push(talkback, res);
              outerTalkback(. talkback);
            },
          ),
        )
      | _ => sink(. signal)
      }
    );
  };

  (res, innerSource);
};

type observableClassT;

[@bs.module] external observableClass: observableClassT = "zen-observable";
[@bs.send]
external _observableFromArray:
  (observableClassT, array('a)) => Wonka.observableT('a) =
  "from";
[@bs.send]
external _observableFrom:
  (observableClassT, Wonka.observableT('a)) => Wonka.observableT('a) =
  "from";
[@bs.send]
external observableForEach:
  (Wonka.observableT('a), 'a => unit) => Js.Promise.t(unit) =
  "forEach";

let observableFromArray = (arr: array('a)): Wonka.observableT('a) =>
  _observableFromArray(observableClass, arr);
let observableFrom = (obs: Wonka.observableT('a)): Wonka.observableT('a) =>
  _observableFrom(observableClass, obs);

[@bs.module]
external callbagFromArray: array('a) => Wonka.callbagT('a) =
  "callbag-from-iter";

[@bs.module]
external callbagFromObservable: Wonka.observableT('a) => Wonka.callbagT('a) =
  "callbag-from-obs";

[@bs.module]
external callbagIterate: (. ('a => unit)) => (. Wonka.callbagT('a)) => unit =
  "callbag-iterate";
