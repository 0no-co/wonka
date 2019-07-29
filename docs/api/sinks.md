---
title: Sinks
order: 2
---

A sink in Wonka expects to be delivered data. A `sink` communicates with a source via the "talkback" function provided by the source. Wonka has the following `sink` operators.

## subscribe

`subscribe` accepts a callback function to execute when data is received from the source, in addition to the source itself.

```reason
Wonka.fromArray([|1, 2, 3|])
  |> Wonka.subscribe((. x) => print_int(x));
/* Prints 123 to the console. */
```

```typescript
import { pipe, fromArray, subscribe } from 'wonka';

pipe(
  fromArray([1, 2, 3]),
  subscribe((x) => console.log(x))
); // Prints 123 to the console.
```

`subscribe` also returns a "subscription" type, which can be used to
unsubscribe from the source. This allows you to cancel a source and stop receiving
new incoming values.

```reason
let subscription = source
  |> Wonka.subscribe((. x) => print_int(x));

subscription.unsubscribe();
```

```typescript
import { pipe, subscribe } from 'wonka';

const [unsubscribe] = pipe(
  source,
  subscribe((x) => console.log(x));
);

unsubscribe();
```

## forEach

`forEach` works the same as `subscribe` but doesn't return a subscription.
It will just call the passed callback for each incoming value.

```reason
Wonka.fromArray([|1, 2, 3|])
  |> Wonka.forEach((. x) => print_int(x));
/* Returns unit; Prints 123 to the console. */
```

```typescript
import { pipe, fromArray, forEach } from 'wonka';

pipe(
  fromArray([1, 2, 3]),
  forEach((x) => console.log(x))
); // Returns undefined; Prints 123 to the console.
```

## publish

`publish` subscribes to a source, like `subscribe` does, but doesn't accept
a callback function. It's useful for side-effects, where the values are already being
used as part of the stream itself.

In this example we're using [`onPush`](./operators.md#onpush) to pass a callback to react to incoming
values instead.

```reason
Wonka.fromArray([|1, 2, 3|])
  |> Wonka.onPush((. x) => print_int(x))
  |> Wonka.publish;
/* Prints 123 to the console. */
```

```typescript
import { pipe, fromArray, onPush, publish } from 'wonka';

pipe(
  fromArray([1, 2, 3]),
  onPush((x) => console.log(x)),
  publish
); // Prints 123 to the console.
```

## toArray

`toArray` returns an array, which contains all values from a pull source.
This sink is primarily intended for synchronous pull streams. Passing it
an asynchronous push streams may result in an empty array being returned.

If you're passing an asynchronous push stream `toArray` will cancel it
before it returns an array.

> _Note:_ If you're using this sink, make sure that your input source streams
> the values you're collecting partly or fully synchronously.

```reason
Wonka.fromArray([|1, 2, 3|])
  |> Wonka.map((. x) => x * 2)
  |> Wonka.toArray
/* Returns [|2, 4, 6|] */
```

```typescript
import { pipe, fromArray, map, toArray } from 'wonka';

pipe(
  fromArray([1, 2, 3]),
  map(x => x * 2),
  toArray
); // Returns [2, 4, 6]
```

## toPromise

`toPromise` returns a promise, which resolves on the last value of a source.

> _Note:_ This source is only available in JavaScript environments, and will be excluded
> when compiling natively.

```reason
Wonka.fromArray([|1, 2, 3|])
  |> Wonka.toPromise
  |> Js.Promise.then_(x => {
    print_int(x);
    Js.Promise.resolve(())
  })
/* Prints 3 to the console. */
```

```typescript
import { pipe, fromArray, toPromise } from 'wonka';

const promise = pipe(
  fromArray([1, 2, 3]),
  toPromise,
);

promise.then(x => console.log(x));
// Prints 3 to the console.
```

If you have a source that doesn't complete and are looking to resolve on the first
value instead of the last, you may have to apply `take(1)` to your source.

## toObservable

`toObservable` returns a [spec-compliant JS Observable](https://github.com/tc39/proposal-observable), which emits the same
values as a source.

As per the specification, the Observable is annotated using `Symbol.observable`.

> _Note:_ This sink is only available in JavaScript environments, and will be excluded
> when compiling natively.

```reason
let observable = Wonka.fromArray([|1, 2, 3|])
  |> Wonka.toObservable;

observable##subscribe([@bs] {
  as _;
  pub next = value => print_int(value);
  pub complete = () => ();
  pub error = _ => ();
}); /* Prints 1 2 3 to the console. */
```

```typescript
import { pipe, fromArray, toObservable } from 'wonka';

const observable = pipe(
  fromArray([1, 2, 3]),
  toObservable,
);

observable.subscribe({
  next: value => console.log(value),
  complete: () => {},
  error: () => {},
}); // Prints 1 2 3 to the console.
```

## toCallbag

`toCallbag` returns a [spec-compliant JS Callbag](https://github.com/callbag/callbag), which emits the same signals
as a Wonka source.

Since Wonka's sources are very similar to callbags and only diverge from the specification
minimally, Callbags map to Wonka's sources very closely and `toCallbag` only creates a thin
wrapper which is mostly concerned with converting between the type signatures.

> _Note:_ This sink is only available in JavaScript environments, and will be excluded
> when compiling natively.

```reason
/* This example uses the callbag-iterate package for illustrative purposes */
[@bs.module] external callbagIterate:
  (. ('a => unit)) => (. Wonka.callbagT('a)) => unit = "callbag-iterate";

let callbag = Wonka.fromArray([|1, 2, 3|])
  |> Wonka.toCallbag;

callbagIterate(. value => {
  print_int(value);
})(. callbag); /* Prints 1 2 3 to the console. */
```

```typescript
import { pipe, fromArray, toCallbag } from 'wonka';

// This example uses the callbag-iterate package for illustrative purposes
import callbagIterate from 'callbag-iterate';

const callbag = pipe(
  fromArray([1, 2, 3]),
  toCallbag,
);

callbagIterate(value => console.log(value))(callbag);
// Prints 1 2 3 to the console.
```
