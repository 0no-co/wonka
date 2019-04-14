open Wonka_types;

let subscribe: ((. 'a) => unit, sourceT('a)) => subscriptionT;
let forEach: ((. 'a) => unit, sourceT('a)) => unit;
