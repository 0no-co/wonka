open Wonka_types;

let switchMap: ((. 'a) => sourceT('b), sourceT('a), sinkT('b)) => unit;
let switchAll: (sourceT(sourceT('a)), sinkT('a)) => unit;
