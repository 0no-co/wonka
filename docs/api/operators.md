---
title: Operators
order: 1
---

Operators in Wonka allow you to transform values from a source before they are sent to a sink. Wonka has the following operators.

## combine

`combine` two sources together to a single source. The emitted value will be a combination of the two sources, with all values from the first source being emitted with the first value of the second source _before_ values of the second source are emitted.

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
import { fromArray, pipe, combine, subscribe } from 'wonka';

const sourceOne = fromArray([1, 2, 3]);
const sourceTwo = fromArray([4, 5, 6]);

pipe(
  combine(sourceOne, sourceTwo),
  subscribe(([valOne, valTwo]) => {
    console.log(valOne + valTwo);
  })
);

// Prints 56789 (1+4, 2+4, 3+4, 3+5, 3+6) to the console.
```

## concat

`concat` will combine two sources together, subscribing to the next source after the previous source completes.

```reason
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let sourceOne = fromArray([|1, 2, 3, 4, 5, 6|]);
let sourceTwo = fromArray([|6, 5, 4, 3, 2, 1|]);

concat([|sourceOne, sourceTwo|]) |> subscribe((. _val) => print_int(_val));

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
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let source = fromArray([|1, 2, 3, 4, 5, 6|]);
let square = (. n) => n * n;

source |> map(square) |> subscribe((. _val) => print_int(_val));

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
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let sourceA = fromArray([|1, 2, 3|]);
let sourceB = fromArray([|4, 5, 6|]);

merge([|sourceA, sourceB|]) |> subscribe((. _val) => print_int(_val));

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

Run a callback _after_ all values have been emitted by the source.

```reason
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let source = fromArray([|1, 2, 3, 4, 5, 6|]);

source
|> onEnd((.) => print_string("Done"))
|> subscribe((. _val) => print_int(_val));

/* Prints 1 2 3 4 5 6 "Done" to the console. */
```

```typescript
import { fromArray, pipe, onEnd, subscribe } from 'wonka';

const source = fromArray([1, 2, 3, 4, 5, 6]);

pipe(
  source,
  onEnd(() => console.log('Done')),
  subscribe(val => {
    console.log(val);
  })
);

// Prints 1 2 3 4 5 6 "Done" to the console.
```

## scan

Accumulate emitted values of a source in a accumulator, similar to JavaScript `reduce`.

```reason
open Wonka;
open Wonka_sources;
open Wonka_operators;
open Wonka_sinks;

let source = fromArray([|1, 2, 3, 4, 5, 6|]);

source
|> scan((. acc, x) => acc + x, 0)
|> subscribe((. _val) => print_int(_val));
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
