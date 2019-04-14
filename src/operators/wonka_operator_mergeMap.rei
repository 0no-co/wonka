open Wonka_types;

let mergeMap: ((. 'a) => sourceT('b), sourceT('a), sinkT('b)) => unit;
let merge: (array(sourceT('a)), sinkT('a)) => unit;
let mergeAll: (sourceT(sourceT('a)), sinkT('a)) => unit;
let flatten: (sourceT(sourceT('a)), sinkT('a)) => unit;
