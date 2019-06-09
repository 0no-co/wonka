# API

This document covers all of the public API, with examples provided in Reason and TypeScript. `wonka` will also work with OCaml and Flow.

## Sources `Wonka_sources`

A `source` in `wonka` is a provider of data. A `source` provides data to a `sink` when the `sink` requests it (modeled in `wonka` as a `Pull` signal). A `sink` requests data via a callback function, known as a "talkback". The "talkback" may also be used to terminate the sending of data by the `source`. `wonka` has the following `source` operators.

### `fromArray`

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

## Sinks `Wonka_sinks`

A `sink` in `wonka` expects to be delivered data. A `sink` communicates with a `source` via the "talkback" function provided by the `source`. `wonka` has the following `sink` operators.

### `subscribe`

`subscribe` accepts a callback function to execute when data is received from the `source`, in addition to the `source` itself.

```reason
open Wonka;
open Wonka_sources;
open Wonka_sinks;

let source = fromArray([|1, 2, 3|]);
source |> subscribe((. _val) => print_int(_val));
/* Prints 123 to the console. */
```

```typescript
import { pipe, fromArray, subscribe } from 'wonka';

const source = fromArray([1, 2, 3]);

pipe(
  source,
  subscribe((x) => {
    console.log(x);
  });
);
// Prints 123 to the console.
```

## Operators `Wonka_operators`

Operators in `wonka` allow you to transform values from a `source` before they are sent to a `sink`. `wonka` has the following operators.

### `combine`

`combine` two `source`s together to a single `source`. All values from the first source will be emitted before values from the second source are emitted.

```reason
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let sourceOne = fromArray([|1, 2, 3|]);
let sourceTwo = fromArray([|4, 5, 6|]);

combine(sourceOne, sourceTwo)
  |> subscribe((. (_valOne, _valTwo)) => print_int(_valOne + _valTwo));
/* Prints 56789 (1+4, 2+4, 3+4, 3+5, 3+6) to the console. */
```

```typescript
import { pipe, combine, subscribe } from 'wonka';

const sourceOne = [1, 2, 3];
const sourceTwo = [4, 5, 6];

pipe(
  combine(sourceOne, sourceTwo),
  subscribe(([valOne, valTwo]) => {
    console.log(valOne + valTwo);
  })
);
// Prints 56789 (1+4, 2+4, 3+4, 3+5, 3+6) to the console.
```

### `filter`

`filter` will remove values from a source by passing them through an iteratee that returns a `bool`.

```reason
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let source = fromArray([|1, 2, 3, 4, 5, 6|]);
let isEven = (. n) => n mod 2 === 0;

source |> filter(isEven) |> subscribe((. _val) => print_int(_val));
/* Prints 246 to the console. */
```

```typescript
import { fromArray, filter, subscribe } from 'wonka';

const source = fromArray([|1, 2, 3, 4, 5, 6|]);
const isEven = (n) => n % 2 === 0;

pipe(
  source,
  filter(isEven),
  subscribe((val) => {
    console.log(val);
  })
);
// Prints 246 to the console.
```

## Web `WonkaJs`

The `WonkaJs` module includes `sources`, `sinks`, and operators specifically for use in web environments. The following `sources`, `sinks`, and operators are included.

### Sources

### `fromDomEvent`

`fromDomEvent` will turn a DOM event into a `wonka` `source`.

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
