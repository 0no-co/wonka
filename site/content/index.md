## What is Wonka

Wonka is a library for lightweight observables and iterables loosely based on the [callbag spec](https://github.com/callbag/callbag).
It exposes a set of helpers to create and transform sources and output sinks, meaning it helps you to turn an event source or an
iterable set of data into streams, and manipulate these streams.

## Why it exists

Reason has been becoming increasingly popular, but it's missing a good pattern for streams that feels native to the language.
The functional nature of callbags make them a perfect starting point to fix this, and to introduce a reactive programming
pattern to a language that is well suited for it.

Hence Wonka is a library that aims to make complex streams of data easy to deal with.

## Installation

Install the library first: `yarn add wonka` or `npm install --save wonka`,

Then add `wonka` to `bs-dependencies` in your `bsconfig.json` file like so:

```json
{
  "name": "<your name>",
  "version": "0.1.0",
  "sources": ["src"],
  "bsc-flags": ["-bs-super-errors"],
  "bs-dependencies": [
    "wonka"
  ]
}
```

And finally, you're ready to start coding with Wonka!

```reason
Wonka.fromList([1, 2, 3, 4, 5, 6])
  |> Wonka.filter(x => x mod 2 === 0)
  |> Wonka.map(x => x * 2)
  |> Wonka.forEach(x => print_endline(string_of_int(x)));
```

