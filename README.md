# Wonka

A fast push & pull stream library for Reason, loosely following the [callbag spec](https://github.com/callbag/callbag)

[![Build Status](https://travis-ci.org/kitten/wonka.svg?branch=master)](https://travis-ci.org/kitten/wonka)
[![Coverage Status](https://coveralls.io/repos/github/kitten/wonka/badge.svg?branch=master)](https://coveralls.io/github/kitten/wonka?branch=master)
[![npm](https://img.shields.io/npm/v/wonka.svg)](https://www.npmjs.com/package/wonka)
[![npm](https://img.shields.io/npm/l/wonka.svg)](https://www.npmjs.com/package/wonka)

> “There’s no earthly way of knowing<br>
> Which direction we are going<br>
> There’s no knowing where we’re rowing<br>
> Or which way the river’s flowing” － **Willy Wonka**

<br>

![Wonka](/docs/wonka.jpg?raw=true)

* [What is `Wonka`](#what-is-wonka)
* [Why it exists](#why-it-exists)
* [Installation](#installation)
* [Getting Started](#getting-started)
* [Documentation (In Progress)](#documentation)

## What is `Wonka`

`Wonka` is a library for lightweight observables and iterables loosely based on the [callbag spec](https://github.com/callbag/callbag).
It exposes a set of helpers to create and transform sources and output sinks, meaning it helps you to turn an event source or an
iterable set of data into streams, and manipulate these streams.

## Why it exists

Reason has been becoming increasingly popular, but it's missing a good pattern for streams that feels native to the language.
The functional nature of callbags make them a perfect starting point to fix this, and to introduce a reactive programming
pattern to a language that is well suited for it.

Hence `Wonka` is a library that aims to make complex streams of data easy to deal with.

## Installation

Install the library first: `yarn add wonka` or `npm install --save wonka`,

Then add `wonka` to `bs-dependencies` in your `bsconfig.json` file like so:

```diff
{
  "name": "<your name>",
  "version": "0.1.0",
  "sources": ["src"],
  "bsc-flags": ["-bs-super-errors"],
  "bs-dependencies": [
+    "wonka"
  ]
}
```

## Getting Started

Writing your first stream is very easy! Let's suppose you would like to create a stream from a list, filter out some values,
then map over the remaining ones, and lastly iterate over the final values.

This can be done with a few operators that might remind you of functions you would also call on iterables.

```reason
let example = [1, 2, 3, 4, 5, 6];

Wonka.fromList(example)
  |> Wonka.filter(x => x mod 2 === 0)
  |> Wonka.map(x => x * 2)
  |> Wonka.forEach(x => print_endline(string_of_int(x)));

/* prints: 4, 8, 12 */
```

To explain what's going on:

- `fromList` creates a pullable source with values from the list
- `filter` only lets even values through
- `map` multiplies the values by `2`
- `forEach` pulls values from the resulting source and prints them

As you can see, all helpers that we've used are exposed on the `Wonka` module.
But if we would like to use JavaScript-based APIs, then we need to use the `WonkaJs` module.

Let's look at the same example, but instead of a list we will use an `interval` stream.
This stream will output ascending numbers starting from `0` indefinitely.

We will code the same example as before but we'd like the `interval` to push
a new number every `50ms` and to stop after seven values.

```reason
WonkaJs.interval(50)
  |> Wonka.take(7)
  |> Wonka.filter(x => x mod 2 === 0)
  |> Wonka.map(x => x * 2)
  |> Wonka.forEach(x => print_endline(string_of_int(x)));

/* prints: 4, 8, 12 */
```

The last three functions stay the same, but we are now using `interval` as our source.
This is a listenable source, meaning that it pushes values downwards when it sees fit.
And the `take` operator tells our source to stop sending values after having received seven
values.

And already you have mastered all the basics of `Wonka` and learned about a couple of its operators!
Go, you! :tada:

## Documentation

I am currently still working on getting some documentation up and running. Those will contain:

- The API, i.e. a list of all helpers
- Examples
- Usage Guides & Recipes
- Developer Guides (How to write a source/operator/sink)
- Modified Callbag spec

Stay tuned and read the signature files in the meantime please:

- [wonka.rei](./src/wonka.rei)
- [wonkaJs.rei](./src/wonka.rei)

