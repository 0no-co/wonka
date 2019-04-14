open Wonka_types;

let onPush: ((. 'a) => unit, sourceT('a), sinkT('a)) => unit;
let tap: ((. 'a) => unit, sourceT('a), sinkT('a)) => unit;
