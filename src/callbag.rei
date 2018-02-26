open Callbag_types;

/* -- source factories */

/* Accepts a list and creates a pullable source for that list.
   The source will emit events when being pulled until the list
   is exhausted and it completes */
let fromList: (list('a), signalT('a) => unit) => unit;

/* Accepts an array and creates a pullable source for that array.
   The source will emit events when being pulled until the array
   is exhausted and it completes */
let fromArray: (array('a), signalT('a) => unit) => unit;

/* -- operators */

/* Takes a mapping function from one type to another, and a source,
   and creates a sink & source.
   All values that it receives will be transformed using the mapping
   function and emitted on the new source */
let map:
  ('a => 'b, (signalT('a) => unit) => unit, signalT('b) => unit) => unit;

/* Takes a predicate function returning a boolean, and a source,
   and creates a sink & source.
   All values that it receives will be filtered using the predicate,
   and only truthy values will be passed on to the new source.
   The sink will attempt to pull a new value when one was filtered. */
let filter:
  ('a => bool, (signalT('a) => unit) => unit, signalT('a) => unit) => unit;

/* Takes a reducer function, a seed value, and a source, and creates
   a sink & source.
   The last returned value from the reducer function (or the seed value
   initially) will be passed to the reducer together with the value
   that the sink receives. All return values of the reducer function
   are emitted on the new source. */
let scan:
  (('b, 'a) => 'b, 'b, (signalT('a) => unit) => unit, signalT('b) => unit) =>
  unit;

/* Takes an array of sources and creates a sink & source.
   All values that the sink receives from all sources will be passed through
   to the new source */
let merge: (array((signalT('a) => unit) => unit), signalT('a) => unit) => unit;

/* Takes a listenable or a pullable source and creates a new source that
   will ensure that the source is shared between all sinks that follow.
   Essentially the original source will only be created once. */
let share: ((signalT('a) => unit) => unit, signalT('a) => unit) => unit;

/* Takes two sources and creates a new source & sink.
   All latest values from both sources will be passed through as a
   tuple of the last values that have been observed */
let combine:
  (
    (signalT('a) => unit) => unit,
    (signalT('b) => unit) => unit,
    signalT(('a, 'b)) => unit
  ) =>
  unit;

/* -- sink factories */

/* Takes a function and a source, and creates a sink.
   The function will be called for each value that the sink receives.
   The sink will attempt to pull new values as values come in, until
   the source ends. */
let forEach: ('a => unit, (signalT('a) => unit) => unit) => unit;

/* Similar to the `forEach` sink factory, but returns an anonymous function
   that when called will end the stream immediately.
   Ending the stream will propagate an End signal upwards to the root source. */
let subscribe: ('a => unit, (signalT('a) => unit) => unit, unit) => unit;
