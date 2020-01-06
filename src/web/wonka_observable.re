open Wonka_types;
open Wonka_helpers;

let observableSymbol: string = [%raw
  {|
  typeof Symbol === 'function'
    ? Symbol.observable || (Symbol.observable = Symbol('observable'))
    : '@@observable'
|}
];

[@genType]
type subscriptionT = {unsubscribe: unit => unit};

[@genType]
type observerT('a) = {
  next: (. 'a) => unit,
  error: (. Js.Exn.t) => unit,
  complete: (. unit) => unit,
};

[@genType]
type observableT('a) = {subscribe: (. observerT('a)) => subscriptionT};

type observableFactoryT('a) = (. unit) => observableT('a);

[@bs.get_index]
external observable_get:
  (observableT('a), string) => option(observableFactoryT('a)) =
  "";
[@bs.get_index]
external observable_unsafe_get:
  (observableT('a), string) => observableFactoryT('a) =
  "";
[@bs.set_index]
external observable_set:
  (observableT('a), string, unit => observableT('a)) => unit =
  "";

[@genType]
let fromObservable = (input: observableT('a)): sourceT('a) => {
  let observable =
    switch (input->observable_get(observableSymbol)) {
    | Some(_) => (input->observable_unsafe_get(observableSymbol))(.)
    | None => input
    };

  curry(sink => {
    let observer: observerT('a) = {
      next: (. value) => sink(. Push(value)),
      complete: (.) => sink(. End),
      error: (. _) => (),
    };

    let subscription = observable.subscribe(. observer);

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => subscription.unsubscribe()
          | _ => ()
          },
      ),
    );
  });
};

type observableStateT = {
  mutable talkback: (. talkbackT) => unit,
  mutable ended: bool,
};

[@genType]
let toObservable = (source: sourceT('a)): observableT('a) => {
  let observable: observableT('a) = {
    subscribe:
      (. observer: observerT('a)) => (
        {
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
              observer.next(. x);
              state.talkback(. Pull);
            | Push(_) => ()
            | End =>
              state.ended = true;
              observer.complete(.);
            }
          );

          {
            unsubscribe: () =>
              if (!state.ended) {
                state.ended = true;
                state.talkback(. Close);
              },
          };
        }: subscriptionT
      ),
  };

  observable->observable_set(observableSymbol, () => observable);
  observable;
};
