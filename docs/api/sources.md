---
title: Sources
order: 0
---

A "source" in Wonka is a provider of data. It provides data to a "sink" when the "sink" requests it. This is called a pull signal and for synchronous sources no time will pass between the sink pulling a new value and a source sending it. For asynchronous sources, the source may either ignore pull signals and just push values or send one some time after the pull signal.

## fromArray

`fromArray` transforms an array into a source, emitting each item synchronously.

```typescript
import { fromArray } from 'wonka';
fromArray([1, 2, 3]);
```

## fromValue

`fromValue` takes a single value and creates a source that emits the value and
completes immediately afterwards.

```typescript
import { fromValue } from 'wonka';
fromValue(1);
```

## make

`make` can be used to create an arbitrary source. It allows you to make a source
from any other data.
It accepts a function that receives an "observer" and should return a teardown
function. It's very similar to creating an [Observable in `zen-observable`](https://github.com/zenparsing/zen-observable#new-observablesubscribe).

The function you pass to `make` is called lazily when a sink subscribes to the
source you're creating. The first argument `observer` is a tuple with two methods:

- `next(value)` emits a value on the sink
- `complete()` ends the source and completes the sink

The subscriber function also needs to return a `teardown` function. This function
is called when either `complete()` is called and the source ends, or if the source
is being cancelled, since the sink unsubscribed.

In this example we create a source that waits for a promise to resolve and emits
values from the array of that promise.

```typescript
import { make } from 'wonka';

const waitForArray = () => Promise.resolve([1, 2, 3]);

const source = make((observer) => {
  const { next, complete } = observer;
  let cancelled = false;

  waitForArray().then((arr) => {
    if (!cancelled) {
      arr.forEach(next);
      complete();
    }
  });

  return () => {
    cancelled = true;
  };
});
```

## makeSubject

`makeSubject` can be used to create a subject. This is similar to [`make`](#make) without
having to define a source function. Instead a subject is a tuple of a source and
the observer's `next` and `complete` functions combined.

A subject can be very useful as a full event emitter. It allows you to pass a source
around but also have access to the observer functions to emit events away from
the source itself.

```typescript
import { makeSubject } from 'wonka';
const subject = makeSubject();
const { source, next, complete } = subject;

/* This will push the values synchronously to any subscribers of source */
next(1);
next(2);
next(complete);
```

## fromDomEvent

`fromDomEvent` will turn a DOM event into a Wonka source, emitting the DOM events
on the source whenever the DOM emits them on the passed element.

```typescript
import { pipe, fromDomEvent, subscribe } from 'wonka';

const element = document.getElementById('root');

pipe(
  fromDomEvent(element, 'click'),
  subscribe((e) => console.log(e))
);
```

## fromPromise

`fromPromise` transforms a promise into a source, emitting the promisified value on
the source once it resolves.

```typescript
import { pipe, fromPromise, subscribe } from 'wonka';

const promise = Promise.resolve(1); // Just an example promise

pipe(
  fromPromise(promise),
  subscribe((e) => console.log(e))
); // Prints 1 to the console.
```

## fromObservable

`fromObservable` transforms a [spec-compliant JS Observable](https://github.com/tc39/proposal-observable) into a source.
The resulting source will behave exactly the same as the Observable that it was
passed, so it will start, end, and push values identically.

```typescript
import { pipe, fromObservable, subscribe } from 'wonka';

// This example uses zen-observable for illustrative purposes
import Observable from 'zen-observable';

const observable = Observable.from([1, 2, 3]);

pipe(
  fromObservable(observable),
  subscribe((e) => console.log(e))
); // Prints 1 2 3 to the console
```

## fromCallbag

`fromCallbag` transforms a [spec-compliant JS Callbag](https://github.com/callbag/callbag) into a source.

Since Wonka's sources are very similar to callbags and only diverge from the specification
minimally, Callbags map to Wonka's sources very closely and the `fromCallbag` wrapper
is very thin and mostly concerned with converting between the type signatures.

```typescript
import { pipe, fromCallbag, subscribe } from 'wonka';

// This example uses the callbag-from-iter package for illustrative purposes
import callbagFromArray from 'callbag-from-iter';

const callbag = callbagFromArray([1, 2, 3]);

pipe(
  fromCallbag(callbag),
  subscribe((e) => console.log(e))
); // Prints 1 2 3 to the console.
```

## interval

`interval` creates a source that emits values after the given amount of milliseconds.
Internally it uses `setInterval` to accomplish this.

```typescript
import { pipe, interval, subscribe } from 'wonka';

pipe(
  interval(50),
  subscribe((e) => console.log(e))
); // Prints 0 1 2... to the console.
// The incrementing number is logged every 50ms
```

## empty

This is a source that doesn't emit any values when subscribed to and
immediately completes.

```typescript
import { pipe, empty, forEach } from 'wonka';

pipe(
  empty,
  forEach((value) => {
    /* This will never be called */
  })
);
```

## never

This is source is similar to [`empty`](#empty).
It doesn't emit any values but also never completes.

```typescript
import { pipe, never, forEach } from 'wonka';

pipe(
  never,
  forEach((value) => {
    /* This will never be called */
  })
);
```
