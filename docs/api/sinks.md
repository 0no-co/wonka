---
title: Sinks
order: 2
---

A sink in Wonka expects to be delivered data. A `sink` communicates with a source via the "talkback" function provided by the source. Wonka has the following `sink` operators.

## subscribe

`subscribe` accepts a callback function to execute when data is received from the source, in addition to the source itself.

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
