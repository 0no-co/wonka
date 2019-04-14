open Wonka_types;

let scan: ((. 'b, 'a) => 'b, 'b, sourceT('a), sinkT('b)) => unit;
