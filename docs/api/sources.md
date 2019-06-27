---
title: Sources
order: 0
---

A "source" in Wonka is a provider of data. It provides data to a "sink" when the "sink" requests it. This is called a pull signal and for synchronous sources no time will pass between the sink pulling a new value and a source sending it. For asynchronous sources, the source may either ignore pull signals and just push values or send one some time after the pull signal.

## fromArray

`fromArray` transforms an array into a source, emitting each item synchronously.

```reason
Wonka.fromArray([|1, 2, 3|]);
```

```typescript
import { fromArray } from 'wonka';
fromArray([1, 2, 3]);
```

## fromList

`fromList` transforms a list into a source, emitting each item synchronously.

> _Note:_ This operator is only useful in Reason / OCaml where lists are a builtin
> data structure.

This is otherwise functionally the same as `fromArray`.

```reason
Wonka.fromList([1, 2, 3]);
```

## fromValue

`fromValue` takes a single value and creates a source that emits the value and
completes immediately afterwards.

```reason
Wonka.fromValue("a value");
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

The subscriber function also needs ot return a `teardown` function. This function
is called when either `complete()` is called and the source ends, or if the source
is being cancelled, since the sink unsubscribed.

In this example we create a source that waits for a promise to resolve and emits
values from the array of that promise.

```reason
let waitForArray = () => Js.Promise.resolve([|1, 2, 3|]);

let source = Wonka.make((. observer) => {
  let (next, complete) = observer;
  let cancelled = ref(false);
  let promise = waitForArray();

  Js.Promise.then_(arr => {
    if (!cancelled^) {
      Array.iter(next, arr);
      complete();
    }
  }, promise);

  () => cancelled := true;
});
```

```typescript
import { make } from 'wonka';

const waitForArray = () => Promise.resolve([1, 2, 3]);

const source = make(observer => {
  const [next, complete] = observer;
  let cancelled = false;

  waitForArray().then(arr => {
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

## fromDomEvent

`fromDomEvent` will turn a DOM event into a Wonka source, emitting the DOM events
on the source whenever the DOM emits them on the passed element.

> This source will only work in a JavaScript environment, and will be excluded
> when compiling natively.

```reason
open WebApi.Dom;
open Document;

let element = getElementById("root", document);

Wonka.fromDomEvent(element, "click")
  |> Wonka.subscribe((. click) => Js.log(click));
```

```typescript
import { pipe, fromDomEvent, subscribe } from 'wonka';

const element = document.getElementById('root');

pipe(
  fromDomEvent(element, 'click'),
  subscribe(e => console.log(e))
);
```
