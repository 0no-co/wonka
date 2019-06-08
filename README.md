# Wonka

A fast push & pull stream library for Reason, loosely following the [callbag spec](https://github.com/callbag/callbag)

<br>
<a href="https://npmjs.com/package/wonka">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/wonka.svg" />
</a>
<a href="https://npmjs.com/package/wonka">
  <img alt="License" src="https://img.shields.io/npm/l/wonka.svg" />
</a>
<a href="https://codecov.io/gh/kitten/wonka">
  <img alt="Test Coverage" src="https://codecov.io/gh/kitten/wonka/branch/master/graph/badge.svg" />
</a>
<a href="https://bundlephobia.com/result?p=wonka">
  <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/wonka.svg?label=gzip%20size" />
</a>
<br>

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

Reason has been becoming increasingly popular, but it's missing a good pattern for streams that feels native to the language.
The functional nature of callbags make them a perfect starting point to fix this, and to introduce a reactive programming
pattern to a language that is well suited for it.

This library also attempts to support as many Reason/JS environments as possible, which makes the adoption of streams across
multiple projects a lot easier.  Hence `Wonka` is a library that aims to make complex streams of data easy to deal with.

## Compatibility

`Wonka` is not only compatible with Reason/Bucklescript, but out of the box with other environments as well.

- TypeScript
- JS/Flow
- Reason/OCaml Bucklescript
- Reason/OCaml `bs-native`
- Reason/OCaml Dune

In summary, it should work in any TypeScript/Flow/Reason/OCaml environment with full type safety.

## Installation

Install the library first: `yarn add wonka` or `npm install --save wonka`,

### BuckleScript

For Bucklescript you will also need to add `wonka` to `bs-dependencies` in your `bsconfig.json` file like so:

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

## Documentation

This is still a work-in-progress but will contain full information on the following
across all supported languages:

- The API, i.e. a list of all helpers
- Examples
- Usage Guides & Recipes
- Developer Guides (How to write a source/operator/sink)
- Modified Callbag spec
