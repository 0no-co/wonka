---
title: Operators
order: 1
---

Operators in Wonka allow you to transform values from a source before they are sent to a sink. Wonka has the following operators.

## combine

`combine` two sources together to a single source. All values from the first source will be emitted before values from the second source are emitted.

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

## filter

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
