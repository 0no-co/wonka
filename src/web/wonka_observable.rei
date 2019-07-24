open Wonka_types;

type observableT('a);

let fromObservable: (observableT('a), sinkT('a)) => unit;
let toObservable: sourceT('a) => observableT('a);
