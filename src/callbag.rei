open Callbag_types;

let fromList: (list('a), signalT('a) => unit) => unit;
let fromArray: (array('a), signalT('a) => unit) => unit;

let map: ('a => 'b, (signalT('a) => unit) => unit, signalT('b) => unit) => unit;
let filter: ('a => bool, (signalT('a) => unit) => unit, signalT('a) => unit) => unit;
let scan: (('b, 'a) => 'b, 'b, (signalT('a) => unit) => unit, signalT('b) => unit) => unit;
let merge: (array((signalT('a) => unit) => unit), signalT('a) => unit) => unit;
let share: ((signalT('a) => unit) => unit, signalT('a) => unit) => unit;

let forEach: ('a => unit, (signalT('a) => unit) => unit) => unit;
let subscribe: ('a => unit, (signalT('a) => unit) => unit) => (unit => unit);
