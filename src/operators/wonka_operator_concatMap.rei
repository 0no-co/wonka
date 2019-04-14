open Wonka_types;

let concatMap: ((. 'a) => sourceT('b), sourceT('a), sinkT('b)) => unit;
let concat: (array(sourceT('a)), sinkT('a)) => unit;
let concatAll: (sourceT(sourceT('a)), sinkT('a)) => unit;
