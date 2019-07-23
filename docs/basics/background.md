---
title: Background
order: 0
---

In a lot of daily tasks in programming we come across patterns where
we deal with lists of values. In JavaScript we'd reach to arrays to
collect them, and luckily there are plenty of methods built-in
to modify such an array, such as `map`, `filter` and `reduce`.

Things become more complex when we're dealing with lists that
are infinite. In such a case we may reach to iterables. We could
expect an iterable that continuously outputs numbers, counting up
infinitely, or rather until it reaches the maximum integer.

When we're dealing with asynchronous lists of values things also
become more complex. We're often confronted with event streams,
where events or even regular values come in over time.

In either cases what we're dealing with are essentially [immutable,
asynchronous iterables](https://medium.com/@andrestaltz/2-minute-introduction-to-rx-24c8ca793877).

Wonka is a library to provide a primitive to solve these problems and
is both: an iterable programming library, and a reactive stream programming
library.

It can be compared to observables and iterables in one library, but is
based on and essentially a ["callbag" library](https://staltz.com/why-we-need-callbags.html).

## Sources, Operators, and Sinks

When we're thinking of solving problems with streams, it's always
a good idea to look at how we're solving problems with arrays.

Since Wonka's streams are an entirely new primitive, Wonka has to provide
all utilities that you as a developer may need to work with them.
Specifically we have to make sure that it's easy to _create_, _transform_,
and _consume_ these streams.

If we compare these utilities to arrays, _creating_ an array is similar to
creating a stream. So Wonka has utilities such as [`fromArray`](../api/sources.md#fromArray) to
create a new source.

A **source** is what we call a stream in Wonka. This is because it
doesn't strictly follow the definition or specification of observables nor
iterables. So we're calling them **sources** since they're just a **source**
of values over time.

Next we would like to _transform_ sources to make them useful.
Like with arrays we may want to map, filter, and reduce them,
so Wonka has **operators** like [`filter`](../api/operators.md#filter) and [`map`](../api/operators.md#map).
But since Wonka is like a toolkit, it comes with a lot more utilities than
just that.

In general, **operators** will accept some arguments and a source
and output a new, transformed source.

Lastly, the sources we create wouldn't be of much use if we wouldn't
be able to _consume_ them. This is similar to using `forEach` on an
array to use its values. Wonka has a [`subscribe`](../api/sinks.md#subscribe) function which
works similarly to how an observable's subscribe method may work.
This is because Wonka's sources are entirely cancellable.

To summarise Wonka's streams are _sources_ of values, which
can be transformed using _operators_, which create new _sources_.
If we want to consume a _source_ we use a _sink_.
