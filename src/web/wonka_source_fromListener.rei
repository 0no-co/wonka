open Wonka_types;

let fromListener:
  (('event => unit) => unit, ('event => unit) => unit, sinkT('event)) => unit;
