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
  |> Wonka.subscribe((. (_valOne, _valTwo)) => print_int(_valOne + _valTwo));

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
let sourceOne = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);
let sourceTwo = Wonka.fromArray([|6, 5, 4, 3, 2, 1|]);

Wonka.concat([|sourceOne, sourceTwo|]) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 1 2 3 4 5 6 6 5 4 3 2 1 to the console. */
```

```typescript
import { fromArray, pipe, concat, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3, 4, 5, 6]);
const sourceTwo = fromArray([6, 5, 4, 3, 2, 1]);

pipe(
  concat([sourceOne, sourceTwo]),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 1 2 3 4 5 6 6 5 4 3 2 1 to the console.
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
  subscribe(val => {
    console.log(val);
  })
);
```

## filter

`filter` will remove values from a source by passing them through an iteratee that returns a `bool`.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);
let isEven = (. n) => n mod 2 === 0;

source |> Wonka.filter(isEven) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 246 to the console. */
```

```typescript
import { fromArray, filter, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);
const isEven = n => n % 2 === 0;

pipe(
  source,
  filter(isEven),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 246 to the console.
```

## map

`map` will transform values from a source by passing them through an iteratee that returns a new value.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);
let square = (. n) => n * n;

source |> Wonka.map(square) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 1 4 9 16 25 36 to the console. */
```

```typescript
import { fromArray, pipe, map, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);
const square = n => n * n;

pipe(
  source,
  map(square),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 1 4 9 16 25 36 to the console.
```

## merge

`merge` two sources together into a single source.

```reason
let sourceA = Wonka.fromArray([|1, 2, 3|]);
let sourceB = Wonka.fromArray([|4, 5, 6|]);

Wonka.merge([|sourceA, sourceB|]) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 1 2 3 4 5 6 to the console.
```

```typescript
import { fromArray, pipe, merge, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([4, 5, 6]);

pipe(
  merge(sourceOne, sourceTwo)
  subscribe((val) => {
    console.log(val);
  })
);

// Prints 1 2 3 4 5 6 to the console.
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
let source = Wonka.concat([|sourceOne, sourceTwo|]);

source
|> Wonka.onEnd((.) => print_endline("onEnd"))
|> Wonka.subscribe((. _val) => print_endline(_val));

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
const source = concat([sourceOne, sourceTwo]);

pipe(
  source,
  onEnd(() => {
    console.log('onEnd');
  }),
  subscribe(val => {
    console.log(val);
  })
);

// Logs ResolveOne after one second, then ResolveTwo after an additional second, then onEnd immediately.
```

## onPush

Run a callback on each `Push` signal sent to the sink by the source.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

Wonka.source
|> Wonka.onPush((. _val) => print_string({j|Push $_val|j}))
|> Wonka.subscribe((. _val) => print_int(_val));

/* Prints Push 1 1 Push 2 2 Push 3 3 Push 4 4 Push 5 5 Push 6 6 to the console. */
```

```typescript
import { fromArray, pipe, onPush, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  onPush(val => {
    console.log(`Push ${val}`);
  }),
  subscribe(val => {
    console.log(val);
  })
);

// Prints Push 1 1 Push 2 2 Push 3 3 Push 4 4 Push 5 5 Push 6 6 to the console.
```

## onStart

Run a callback when the `Start` signal is sent to the sink by the source.

```reason
let promise =
  Js.Promise.make((~resolve, ~reject as _) =>
    Js.Global.setTimeout(() => resolve(. "Resolve"), 1000) |> ignore
  );

let source = Wonka.fromPromise(promise);

source
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

const source = fromPromise(promise);

pipe(
  source,
  onStart(() => {
    console.log('onStart');
  }),
  subscribe(val => {
    console.log(val);
  })
);

// Logs onStart to the console, pauses for one second to allow the timeout to finish,
// then logs "Resolve" to the console.
```

## scan

Accumulate emitted values of a source in a accumulator, similar to JavaScript `reduce`.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source
|> Wonka.scan((. acc, x) => acc + x, 0)
|> Wonka.subscribe((. _val) => print_int(_val));
/* Prints 1 3 6 10 15 21 to the console. */
```

```typescript
import { fromArray, pipe, scan, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  scan((acc, val) => acc + val),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 1 3 6 10 15 21 to the console.
```

## skip

`skip` the specified number of emissions from the source.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source |> Wonka.skip(2) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 3 4 5 6 to the console, since the first two emissions from the source were skipped.
```

```typescript
import { fromArray, pipe, skip, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  skip(2),
  subscribe(val => {
    console.log(val);
  })
);
```

## skipUntil

Skip emissions from an outer source until an inner source (notifier) emits.

```reason
let source = Wonka.interval(100);
let notifier = Wonka.interval(500);

source |> Wonka.skipUntil(notifier) |> Wonka.subscribe((. _val) => print_int(_val));

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
  subscribe(val => {
    console.log(val);
  })
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

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  skipWhile(val => val < 5),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 5 6 to the console, as 1 2 3 4 all return true for the predicate function.
```

## take

`take` only a specified number of emissions from the source before completing. `take` is the opposite of `skip`.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source |> Wonka.take(3) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 1 2 3 to the console. */
```

```typescript
import { fromArray, pipe, take, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  take(3),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 1 2 3 to the console.
```

## takeLast

`takeLast` will take only the last n emissions from the source.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source |> Wonka.takeLast(3) |> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 4 5 6 to the console. */
```

```typescript
import { fromArray, pipe, takeLast, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  takeLast(3),
  subscribe(val => {
    console.log(val);
  })
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
|> Wonka.subscribe((. _val) => print_int(_val));

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
  subscribe(val => {
    console.log(val);
  })
);

// Pauses 100ms, prints 0, pauses 100ms, prints 1, pauses 100ms, prints 2, pauses 100ms,
// prints 3, pauses 100, then completes (notifier emits).
```

## takeWhile

Take emissions from the stream while they return `true` for the provided predicate function. If the first emission does not return `true`, no values will be `Push`ed to the sink.

```reason
let source = Wonka.fromArray([|1, 2, 3, 4, 5, 6|]);

source
|> Wonka.takeWhile((. _val) => _val < 5)
|> Wonka.subscribe((. _val) => print_int(_val));

/* Prints 1 2 3 4 to the console. */
```

```typescript
import { pipe, fromArray, takeWhile, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  takeWhile(val => val < 5),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 1 2 3 4 to the console.
```
