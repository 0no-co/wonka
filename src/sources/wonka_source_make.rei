open Wonka_types;

let make: ((. observerT('a)) => teardownT, sinkT('a)) => unit;
