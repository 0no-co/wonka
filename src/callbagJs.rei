open Callbag_types;

let interval: (int, signalT(int) => unit) => unit;
let fromPromise: (Js.Promise.t('a), signalT('a) => unit) => unit;
