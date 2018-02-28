open Wonka_types;

/* -- source factories */

/* Accepts a period in milliseconds and creates a listenable source
   that emits ascending numbers for each time the interval fires.
   This stream will emit values indefinitely until it receives an
   End signal from a talkback passed downwards to its sink. */
let interval: (int, signalT(int) => unit) => unit;

/* Accepts a JS promise and creates a listenable source that emits
   the promise's value once it resolves.
   This stream will wait for the promise's completion, unless it
   receives an End signal first. */
let fromPromise: (Js.Promise.t('a), signalT('a) => unit) => unit;
