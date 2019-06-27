---
title: Sources
order: 0
---

A "source" in Wonka is a provider of data. It provides data to a "sink" when the "sink" requests it. This is called a pull signal and for synchronous sources no time will pass between the sink pulling a new value and a source sending it. For asynchronous sources, the source may either ignore pull signals and just push values or send one some time after the pull signal.

## fromArray

`fromArray` transforms an `array` into a `source`.

```reason
open Wonka;
open Wonka_sources;

let source = fromArray([|1, 2, 3|]);
/* Creates a source that will emit 1...2...3 followed by an End signal. */
```

```typescript
import { pipe, fromArray } from 'wonka';

pipe(
  [1, 2, 3],
  fromArray
);
/* Creates a source that will emit 1...2...3 followed by an End signal. */
```

## fromDomEvent

`fromDomEvent` will turn a DOM event into a `wonka` `source`.

This source will only work in a JavaScript environment, and will be excluded
when compiling natively.

```reason
open Wonka;
open WonkaJs;
open Wonka_sinks;
/* Assumes installation of bs-webapi-incubator for DOM APIs. */
open WebApi.Dom;
open Document;

let element = getElementById("root", document);

fromDomEvent(element, "click")
  |> subscribe((. click) => Js.log(click));
/* Prints click event to the console. */
```

```typescript
import { pipe, fromDomEvent, subscribe } from 'wonka';

const element = document.getElementById('root');

pipe(
  fromDomEvent(element, 'click'),
  subscribe(e => {
    console.log(e);
  })
);
// Prints click event to the console.
```
