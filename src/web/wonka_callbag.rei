open Wonka_types;

type callbagT('a);

let fromCallbag: (callbagT('a), sinkT('a)) => unit;
let toCallbag: sourceT('a) => callbagT('a);
