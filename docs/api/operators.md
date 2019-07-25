---
title: Operators
order: 1
---

Operators in Wonka allow you to transform values from a source before they are sent to a sink. Wonka has the following operators.

## buffer

Buffers emissions from an outer source and emits a buffer array of items every time an
inner source (notifier) emits.

This operator can be used to group values into a arrays on a source. The emitted values will
be sent when a notifier fires and will be arrays of all items before the notification event.

In combination with `interval` this can be used to group values in chunks regularly.

```reason
Wonka.interval(50)
  |> Wonka.buffer(Wonka.interval(100))
  |> Wonka.take(2)
  |> Wonka.subscribe((. buffer) => {
    Js.Array.forEach(num => print_int(num), buffer);
    print_endline(";");
  });
/* Prints 1 2; 2 3 to the console. */
```

``` typescript
import { pipe, interval, buffer, take, subscribe } from 'wonka';

pipe(
  interval(50),
  buffer(interval(100)),
  take(2),
  subscribe(buffer => {
    buffer.forEach(x => console.log(x));
    console.log(';');
  })
); // Prints 1 2; 2 3 to the console.
```

## combine

`combine` two sources together to a single source. The emitted value will be a combination of the two sources, with all values from the first source being emitted with the first value of the second source _before_ values of the second source are emitted.

```reason
let sourceOne = Wonka.fromArray([|1, 2, 3|]);
let sourceTwo = Wonka.fromArray([|4, 5, 6|]);

Wonka.combine(sourceOne, sourceTwo)
  |> Wonka.subscribe((. (a, b)) => print_int(a + b));

/* Prints 56789 (1+4, 2+4, 3+4, 3+5, 3+6) to the console. */
```

```typescript
import { fromArray, pipe, combine, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([4, 5, 6]);

pipe(
  combine(sourceOne, sourceTwo),
  subscribe(([valOne, valTwo]) => {
    console.log(valOne + valTwo);
  })
); // Prints 56789 (1+4, 2+4, 3+4, 3+5, 3+6) to the console.
```

## concat

`concat` will combine two sources together, subscribing to the next source after the previous source completes.

```reason
let sourceOne = Wonka.fromArray([|1, 2, 3|]);
let sourceTwo = Wonka.fromArray([|6, 5, 4|]);

Wonka.concat([|sourceOne, sourceTwo|])
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 6 5 4 to the console. */
```

```typescript
import { fromArray, pipe, concat, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([6, 5, 4]);

pipe(
  concat([sourceOne, sourceTwo]),
  subscribe(val => console.log(val))
); // Prints 1 2 3 6 5 4 to the console.
```

## concatAll

`concatAll` will combine all sources emitted on an outer source together, subscribing to the
next source after the previous source completes.

It's very similar to `concat`, but instead accepts a source of sources as an input.

```reason
let sourceOne = Wonka.fromArray([|1, 2, 3|]);
let sourceTwo = Wonka.fromArray([|6, 5, 4|]);

Wonka.fromList([sourceOne, sourceTwo])
  |> Wonka.concatAll
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 6 5 4 to the console. */
```

```typescript
import { pipe, fromArray, concatAll, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([6, 5, 4]);

pipe(
  fromArray([sourceOne, sourceTwo]),
  concatAll,
  subscribe(val => console.log(val))
); // Prints 1 2 3 6 5 4 to the console.
```

## concatMap

`concatMap` allows you to map values of an outer source to an inner source. The sink will not dispatch the `Pull` signal until the previous value has been emitted. This is in contrast to `mergeMap`, which will dispatch the `Pull` signal for new values even if the previous value has not yet been emitted.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source
|> Wonka.concatMap((. _val) =>
     Wonka.delay(_val * 1000, Wonka.fromValue(_val))
   )
|> Wonka.subscribe((. _val) => print_int(_val));

/* After 1s, 1 will be emitted. After an additional 2s, 2 will be emitted.
After an additional 3s, 3 will be emitted. After an additional 4s, 4 will be emitted.
After an additional 5s, 5 will be emitted. After an additional 6s, 6 will be emitted. */
```

```typescript
import { fromArray, pipe, concatMap, delay, fromValue, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  concatMap(val => {
    return pipe(
      fromValue(val),
      delay(val * 1000)
    );
  }),
  subscribe(val => console.log(val))
);
```


## delay

`delay` delays all emitted values of a source by the given amount of milliseconds.

> _Note:_ This operator is only available in JavaScript environments, and will be excluded
> when compiling natively.

```reason
Wonka.fromList([1, 2])
  |> Wonka.delay(10)
  |> Wonka.subscribe((. x) => print_int(x));
/* waits 10ms then prints 1, waits 10ms then prints 2, waits 10ms then ends */
```

```typescript
import { pipe, fromArray, delay, subscribe } from 'wonka';

pipe(
  fromArray([1, 2]),
  delay(10)
  subscribe(val => console.log(val))
);
// waits 10ms then prints 1, waits 10ms then prints 2, waits 10ms then ends
```

## debounce

`debounce` doesn't emit values of a source until no values have been emitted after
a given amount of milliseconds. Once this threshold of silence has been reached, the
last value that has been received will be emitted.

> _Note:_ This operator is only available in JavaScript environments, and will be excluded
> when compiling natively.

```reason
let sourceA = Wonka.interval(10)
  |> Wonka.take(5);
let sourceB = Wonka.fromValue(1);

Wonka.concat([|sourceA, sourceB|])
  |> Wonka.debounce((. _x) => 20)
  |> Wonka.subscribe((. x) => print_int(x));
/* The five values from sourceA will be omitted */
/* After these values and after 20ms `1` will be logged */
```

```typescript
import { pipe, interval, take, fromValue, concat, debounce, subscribe } from 'wonka';

const sourceA = pipe(interval(10), take(5));
const sourceB = fromValue(1);

pipe(
  concat([sourceA, sourceB])
  debounce(() => 20),
  subscribe(val => console.log(val))
);

// The five values from sourceA will be omitted
// After these values and after 20ms `1` will be logged
```

## filter

`filter` will remove values from a source by passing them through an iteratee that returns a `bool`.

```reason
let isEven = (. n) => n mod 2 === 0;

Wonka.fromArray([|1, 2, 3, 4, 5, 6|])
  |> Wonka.filter(isEven)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 246 to the console. */
```

```typescript
import { fromArray, filter, subscribe } from 'wonka';

const isEven = n => n % 2 === 0;

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  filter(isEven),
  subscribe(val => console.log(val))
);

// Prints 246 to the console.
```

## map

`map` will transform values from a source by passing them through an iteratee that returns a new value.

```reason
let square = (. n) => n * n;

Wonka.fromArray([|1, 2, 3, 4, 5, 6|])
  |> Wonka.map(square)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 4 9 16 25 36 to the console. */
```

```typescript
import { fromArray, pipe, map, subscribe } from 'wonka';

const square = n => n * n;

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  map(square),
  subscribe(val => console.log(val))
);

// Prints 1 4 9 16 25 36 to the console.
```

## merge

`merge` merges an array of sources together into a single source. It subscribes
to all sources that it's passed and emits all their values on the output source.

```reason
let sourceA = Wonka.fromArray([|1, 2, 3|]);
let sourceB = Wonka.fromArray([|4, 5, 6|]);

Wonka.merge([|sourceA, sourceB|])
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 4 5 6 to the console. */
```

```typescript
import { fromArray, pipe, merge, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([4, 5, 6]);

pipe(
  merge(sourceOne, sourceTwo),
  subscribe((val) => console.log(val))
); // Prints 1 2 3 4 5 6 to the console.
```

## mergeAll

`mergeAll` will merge all sources emitted on an outer source into a single one.
It's very similar to `merge`, but instead accepts a source of sources as an input.

> _Note:_ This operator is also exported as `flatten` which is just an alias for `mergeAll`

```reason
let sourceA = Wonka.fromArray([|1, 2, 3|]);
let sourceB = Wonka.fromArray([|4, 5, 6|]);

Wonka.fromList([sourceA, sourceB])
  |> Wonka.mergeAll
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 4 5 6 to the console. */
```

```typescript
import { pipe, fromArray, mergeAll, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([4, 5, 6]);

pipe(
  fromArray([sourceOne, sourceTwo]),
  mergeAll,
  subscribe(val => console.log(val))
); // Prints 1 2 3 4 5 6 to the console.
```

## mergeMap

`mergeMap` allows you to map values of an outer source to an inner source.
This allows you to create nested sources for each emitted value, which will
all be merged into a single source, like with `mergeAll`.

Unlike `concatMap` all inner sources will be subscribed to at the same time
and all their values will be emitted on the output source as they come in.

```reason
Wonka.fromList([1, 2])
  |> Wonka.mergeMap((. value) =>
    Wonka.fromList([value - 1, value]))
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 0 1 1 2 to the console. */
```

```typescript
import { pipe, fromArray, mergeMap, subscribe } from 'wonka';

pipe(
  fromArray([1, 2]),
  mergeMap(x => fromArray([x - 1, x])),
  subscribe(val => console.log(val))
); // Prints 0 1 1 2 to the console.
```

## onEnd

Run a callback when the `End` signal has been sent to the sink by the source, whether by way of the talkback passing the `End` signal or the source being exhausted of values.

```reason
let promiseOne =
  Js.Promise.make((~resolve, ~reject as _) =>
    Js.Global.setTimeout(() => resolve(. "ResolveOne"), 1000) |> ignore
  );

let promiseTwo =
  Js.Promise.make((~resolve, ~reject as _) =>
    Js.Global.setTimeout(() => resolve(. "ResolveTwo"), 2000) |> ignore
  );

let sourceOne = Wonka.fromPromise(promiseOne);
let sourceTwo = Wonka.fromPromise(promiseTwo);

Wonka.concat([|sourceOne, sourceTwo|])
  |> Wonka.onEnd((.) => print_endline("onEnd"))
  |> Wonka.subscribe((. x) => print_endline(x));

/* Logs ResolveOne after one second, then ResolveTwo after an additional second, then onEnd immediately. */
```

```typescript
import { fromPromise, pipe, concat, onEnd, subscribe } from 'wonka';

const promiseOne = new Promise(resolve => {
  setTimeout(() => {
    resolve('ResolveOne');
  }, 1000);
});
const promiseTwo = new Promise(resolve => {
  setTimeout(() => {
    resolve('ResolveTwo');
  }, 2000);
});

const sourceOne = fromPromise(promiseOne);
const sourceTwo = fromPromise(promiseTwo);

pipe(
  concat([sourceOne, sourceTwo]),
  onEnd(() => console.log('onEnd')),
  subscribe(val => console.log(val))
);

// Logs ResolveOne after one second, then ResolveTwo after an additional second, then onEnd immediately.
```

## onPush

Run a callback on each `Push` signal sent to the sink by the source.

```reason
Wonka.fromArray([|1, 2, 3, 4, 5, 6|])
  |> Wonka.onPush((. x) => print_string({j|Push $x|j}))
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints Push 1 1 Push 2 2 Push 3 3 Push 4 4 Push 5 5 Push 6 6 to the console. */
```

```typescript
import { fromArray, pipe, onPush, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  onPush(val => console.log(`Push ${val}`)),
  subscribe(val => console.log(val))
); // Prints Push 1 1 Push 2 2 Push 3 3 Push 4 4 Push 5 5 Push 6 6 to the console.
```

## onStart

Run a callback when the `Start` signal is sent to the sink by the source.

```reason
let promise =
  Js.Promise.make((~resolve, ~reject as _) =>
    Js.Global.setTimeout(() => resolve(. "Resolve"), 1000) |> ignore
  );

Wonka.fromPromise(promise)
  |> Wonka.onStart((.) => print_endline("onStart"))
  |> Wonka.subscribe((. _val) => print_endline(_val));
/* Logs onStart to the console, pauses for one second to allow the timeout to finish,
then logs "Resolve" to the console. */
```

```typescript
import { pipe, onStart, fromPromise, subscribe } from 'wonka';

const promise = new Promise(resolve => {
  setTimeout(() => {
    resolve('Resolve');
  }, 1000);
});

pipe(
  fromPromise(promise),
  onStart(() => console.log('onStart')),
  subscribe(val => console.log(val))
);

// Logs onStart to the console, pauses for one second to allow the timeout to finish,
// then logs "Resolve" to the console.
```

## sample

`sample` emits the previously emitted value from an outer source every time
an inner source (notifier) emits.

In combination with `interval` it can be used to get values from a noisy source
more regularly.

```reason
Wonka.interval(10)
  |> Wonka.sample(Wonka.interval(100))
  |> Wonka.take(2)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 10 20 to the console. */
```

``` typescript
import { pipe, interval, sample, take, subscribe } from 'wonka';

pipe(
  interval(10),
  sample(interval(100)),
  take(2),
  subscribe(x => console.log(x))
); // Prints 10 20 to the console.
```

## scan

Accumulate emitted values of a source in a accumulator, similar to JavaScript `reduce`.

```reason
Wonka.fromArray([|1, 2, 3, 4, 5, 6|])
  |> Wonka.scan((. acc, x) => acc + x, 0)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 3 6 10 15 21 to the console. */
```

```typescript
import { fromArray, pipe, scan, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  scan((acc, val) => acc + val),
  subscribe(val => console.log(val))
);

// Prints 1 3 6 10 15 21 to the console.
```

## share

`share` ensures that all subscriptions to the underlying source are shared.

By default Wonka's sources are lazy. They only instantiate themselves and begin
emitting signals when they're being subscribed to, since they're also immutable.
This means that when a source is used in multiple places, their underlying subscription
is not shared. Instead, the entire chain of sources and operators will be instantiated
separately every time.

The `share` operator prevents this by creating an output source that will reuse a single
subscription to the parent source, which will be unsubscribed from when no sinks are
listening to it anymore.

This is especially useful if you introduce side-effects to your sources,
for instance with `onStart`.

```reason
let source = Wonka.never
  |> Wonka.onStart((.) => print_endline("start"))
  |> Wonka.share;

/* Without share this would print "start" twice: */
Wonka.publish(source);
Wonka.publish(source);
```

```typescript
import { pipe, never, onStart, share, publish } from 'wonka';

const source = pipe(
  never
  onStart(() => console.log('start')),
  share
);

// Without share this would print "start" twice:
publish(source);
publish(source);
```

## skip

`skip` the specified number of emissions from the source.

```reason
Wonka.fromArray([|1, 2, 3, 4, 5, 6|])
  |> Wonka.skip(2)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 3 4 5 6 to the console, since the first two emissions from the source were skipped.
```

```typescript
import { fromArray, pipe, skip, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  skip(2),
  subscribe(val => console.log(val))
);
```

## skipUntil

Skip emissions from an outer source until an inner source (notifier) emits.

```reason
let source = Wonka.interval(100);
let notifier = Wonka.interval(500);

source
  |> Wonka.skipUntil(notifier)
  |> Wonka.subscribe((. x) => print_int(x));

/* Skips all values emitted by source (0, 1, 2, 3) until notifier emits at 500ms.
Then logs 4 5 6 7 8 9 10... to the console every 500ms. */
```

```typescript
import { interval, pipe, skipUntil, subscribe } from 'wonka';

const source = interval(100);
const notifier = interval(500);

pipe(
  source,
  skipUntil(notifier),
  subscribe(val => console.log(val))
);

// Skips all values emitted by source (0, 1, 2, 3) until notifier emits at 500ms.
// Then logs 4 5 6 7 8 9 10... to the console every 500ms.
```

## skipWhile

Skip values emitted from the source while they return `true` for the provided predicate function.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source
|> Wonka.skipWhile((. _val) => _val < 5)
|> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 5 6 to the console, as 1 2 3 4 all return true for the predicate function. */
```

```typescript
import { fromArray, pipe, skipWhile, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  skipWhile(val => val < 5),
  subscribe(val => console.log(val))
);

// Prints 5 6 to the console, as 1 2 3 4 all return true for the predicate function.
```

## switchMap

`switchMap` allows you to map values of an outer source to an inner source.
The inner source's values will be emitted on the returned output source. If
a new inner source is returned, because the outer source emitted a new value
before the previous inner source completed, the inner source is closed and unsubscribed
from.

This is similar to `concatMap` but instead of waiting for the last inner source to complete
before emitting values from the next, `switchMap` just cancels the previous inner source.

```reason
Wonka.interval(50)
  |> Wonka.switchMap((. _value) =>
    Wonka.interval(40))
  |> Wonka.take(3)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 to the console. */
/* The inner interval is cancelled after its first value every time */
```

```typescript
import { pipe, interval, switchMap, take, subscribe } from 'wonka';

pipe(
  interval(50),
  // The inner interval is cancelled after its first value every time
  switchMap(value => interval(40)),
  take(3),
  subscribe(x => console.log(x))
); // Prints 1 2 3 to the console
```

## switchAll

`switchAll` will combined sources emitted on an outer source together, subscribing
to only one source at a time, and cancelling the previous inner source, when it hasn't
ended while the next inner source is created.

It's very similar to `switchMap`, but instead accepts a source of sources.

```reason
Wonka.interval(50)
  |> Wonka.map((. _value) =>
    Wonka.interval(40))
  |> Wonka.switchAll
  |> Wonka.take(3)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 to the console. */
```

```typescript
import { pipe, interval, map, switchAll, take, subscribe } from 'wonka';

pipe(
  interval(50),
  map(() => interval(40)),
  switchAll,
  take(3),
  subscribe(x => console.log(x))
); // Prints 1 2 3 to the console
```

These examples are practically identical to the `switchMap` examples, but note
that `map` was used instead of using `switchMap` directly. This is because combining
`map` with a subsequent `switchAll` is the same as using `switchMap`.

## take

`take` only a specified number of emissions from the source before completing. `take` is the opposite of `skip`.

```reason
Wonka.fromArray([|1, 2, 3, 4, 5, 6|])
  |> Wonka.take(3)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 1 2 3 to the console. */
```

```typescript
import { fromArray, pipe, take, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  take(3),
  subscribe(val => console.log(val))
);

// Prints 1 2 3 to the console.
```

## takeLast

`takeLast` will take only the last n emissions from the source.

```reason
Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);
  |> Wonka.takeLast(3)
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 4 5 6 to the console. */
```

```typescript
import { fromArray, pipe, takeLast, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3, 4, 5, 6]),
  takeLast(3),
  subscribe(val => console.log(val))
);

// Prints 4 5 6 to the console.
```

## takeUntil

Take emissions from an outer source until an inner source (notifier) emits.

```reason
let source = Wonka.interval(100);
let notifier = Wonka.interval(500);

source
  |> Wonka.takeUntil(notifier)
  |> Wonka.subscribe((. x) => print_int(x));

/* Pauses 100ms, prints 0, pauses 100ms, prints 1, pauses 100ms, prints 2, pauses 100ms,
prints 3, pauses 100, then completes (notifier emits). */
```

```typescript
import { interval, pipe, takeUntil, subscribe } from 'wonka';

const source = interval(100);
const notifier = interval(500);

pipe(
  source,
  takeUntil(notifier),
  subscribe(val => console.log(val))
);

// Pauses 100ms, prints 0, pauses 100ms, prints 1, pauses 100ms, prints 2, pauses 100ms,
// prints 3, pauses 100, then completes (notifier emits).
```

## takeWhile

Take emissions from the stream while they return `true` for the provided predicate function. If the first emission does not return `true`, no values will be `Push`ed to the sink.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source
  |> Wonka.takeWhile((. x) => x < 5)
  |> Wonka.subscribe((. x) => print_int(x));

/* Prints 1 2 3 4 to the console. */
```

```typescript
import { pipe, fromArray, takeWhile, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  takeWhile(val => val < 5),
  subscribe(val => console.log(val))
);

// Prints 1 2 3 4 to the console.
```

## throttle

`throttle` emits values of a source, but after each value it will omit all values for
the given amount of milliseconds. It enforces a time of silence after each value it
receives and skips values while the silence is still ongoing.

This is very similar to `debounce` but instead of waiting for leading time before a
value it waits for trailing time after a value.

> _Note:_ This operator is only available in JavaScript environments, and will be excluded
> when compiling natively.

```reason
Wonka.interval(10)
  |> Wonka.throttle((. _x) => 50)
  |> Wonka.take(2)
  |> Wonka.subscribe((. x) => print_int(x));
/* Outputs 0 6 to the console. */
```

```typescript
import { pipe, interval, throttle, take, subscribe } from 'wonka';

pipe(
  interval(10),
  throttle(() => 50)
  takew(2),
  subscribe(val => console.log(val))
); // Outputs 0 6 to the console.
```
