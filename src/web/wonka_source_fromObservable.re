open Wonka_types;

type observableT('a);
type subscriptionT;

[@bs.deriving abstract]
type observerT('a) = {
  next: 'a => unit,
  error: Js.Exn.t => unit,
  complete: unit => unit,
};

let observableSymbol: string = [%raw
  {|
  typeof Symbol === 'function' && Symbol.observable || '@@observable'
|}
];

type observableFactoryT('a) = (. unit) => observableT('a);

[@bs.get_index]
external observableProperty:
  (observableT('a), string) => option(observableFactoryT('a)) =
  "";

[@bs.send]
external subscribe: (observableT('a), observerT('a)) => subscriptionT =
  "subscribe";
[@bs.send] external unsubscribe: subscriptionT => unit = "unsubscribe";

let fromObservable = observable =>
  switch (observableProperty(observable, observableSymbol)) {
  | Some(factory) =>
    curry(sink => {
      let observer =
        observerT(
          ~next=value => sink(. Push(value)),
          ~complete=() => sink(. End),
          ~error=_ => () /* NOTE: This is currently a noop */
        );

      let subscription = subscribe(factory(.), observer);

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close => unsubscribe(subscription)
            | _ => ()
            },
        ),
      );
    })
  | None => Wonka_source_primitives.empty
  };
