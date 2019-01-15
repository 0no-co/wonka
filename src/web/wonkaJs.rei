open Wonka_types;

/* -- source factories */

/* Accepts an event listening start function and stop function
   and creates a listenable source that emits the received events.
   This stream will emit values indefinitely until it receives an
   End signal from a talkback passed downwards to its sink, which
   calls the stop function using the internal handler.
   This works well for Dom event listeners, for example the ones
   in bs-webapi-incubator:
   https://github.com/reasonml-community/bs-webapi-incubator/blob/master/src/dom/events/EventTargetRe.re
   */
let fromListener:
  (
    ('event => unit) => unit,
    ('event => unit) => unit,
    sinkT('event)
  ) =>
  unit;

/* Accepts a Dom.element type and an event nme and creates a listenable
   source that emits values of the Dom.event type. This stream is
   created using the fromListener helper and more specific events
   should be created using the methods in bs-webapi-incubator:
   https://github.com/reasonml-community/bs-webapi-incubator/blob/master/src/dom/events/EventTargetRe.re
   */
let fromDomEvent: (Dom.element, string, sinkT(Dom.event)) => unit;

/* Accepts a period in milliseconds and creates a listenable source
   that emits ascending numbers for each time the interval fires.
   This stream will emit values indefinitely until it receives an
   End signal from a talkback passed downwards to its sink. */
let interval: (int, sinkT(int)) => unit;

/* Accepts a JS promise and creates a listenable source that emits
   the promise's value once it resolves.
   This stream will wait for the promise's completion, unless it
   receives an End signal first. */
let fromPromise: (Js.Promise.t('a), sinkT('a)) => unit;

/* -- operators */

/* Takes a projection to a period in milliseconds and a source, and creates
   a listenable source that emits the last emitted value if no other value
   has been emitted during the passed debounce period. */
let debounce: ((.'a) => int, sourceT('a), sinkT('a)) => unit;

/* Takes a projection to a period in milliseconds and a source, and creates
   a listenable source that ignores values after the last emitted value for
   the duration of the returned throttle period. */
let throttle: ((.'a) => int, sourceT('a), sinkT('a)) => unit;

/* Takes a notifier source and an input source, and creates a sink & source.
   When the notifier emits a value, it will emit the value that it most recently
   received from the input source, unless said source hasn't emitted anything
   since the last signal. */
let sample: (sourceT('a), sourceT('b), sinkT('b)) => unit;

/* Takes a projection to a period in milliseconds and a source, and creates
   a listenable source that delays every emission by that passed period. */
let delay: (int, sourceT('a), sinkT('a)) => unit;

/* Converts a stream into a promise by resolving to the last value of the
   stream. */
let toPromise: sourceT('a) => Js.Promise.t('a);
