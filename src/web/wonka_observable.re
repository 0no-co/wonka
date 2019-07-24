open Wonka_types;
open Wonka_helpers;

let observableSymbol: string = [%raw
  {|
  typeof Symbol === 'function'
    ? Symbol.observable || (Symbol.observable = Symbol('observable'))
    : '@@observable'
|}
];

type subscriptionT = {. [@bs.meth] "unsubscribe": unit => unit};

type observerT('a) = {
  .
  [@bs.meth] "next": 'a => unit,
  [@bs.meth] "error": Js.Exn.t => unit,
  [@bs.meth] "complete": unit => unit,
};

type observableT('a) = {
  .
  [@bs.meth] "subscribe": observerT('a) => subscriptionT,
};

type observableFactoryT('a) = (. unit) => observableT('a);

[@bs.get_index]
external observableGet:
  (observableT('a), string) => option(observableFactoryT('a)) =
  "";
[@bs.set_index]
external observableSet:
  (observableT('a), string, unit => observableT('a)) => unit =
  "";

let fromObservable = (input: observableT('a)): sourceT('a) => {
  let observable =
    switch (observableGet(input, observableSymbol)) {
    | Some(observableFactory) => observableFactory(.)
    | None => input
    };

  curry(sink => {
    let unsubscribe = ref(() => ());
    let observer: observerT('a) =
      [@bs]
      {
        as _;
        pub next = value => sink(. Push(value));
        pub complete = () => sink(. End);
        pub error = _ => ()
      };

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => unsubscribe^()
          | _ => ()
          },
      ),
    );

    let subscription = observable##subscribe(observer);
    unsubscribe := (() => subscription##unsubscribe());
  });
};

type observableStateT = {
  mutable talkback: (. talkbackT) => unit,
  mutable ended: bool,
};

let toObservable = (source: sourceT('a)): observableT('a) => {
  let observable: observableT('a) =
    [@bs]
    {
      as _;
      pub subscribe = (observer: observerT('a)): subscriptionT => {
        let state: observableStateT = {
          talkback: talkbackPlaceholder,
          ended: false,
        };

        source((. signal) =>
          switch (signal) {
          | Start(x) =>
            state.talkback = x;
            x(. Pull);
          | Push(x) when !state.ended =>
            observer##next(x);
            state.talkback(. Pull);
          | Push(_) => ()
          | End =>
            state.ended = true;
            observer##complete();
          }
        );

        [@bs]
        {
          as _;
          pub unsubscribe = () =>
            if (!state.ended) {
              state.ended = true;
              state.talkback(. Close);
            }
        };
      }
    };

  observableSet(observable, observableSymbol, () => observable);
  observable;
};
