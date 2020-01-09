---
title: API Reference
order: 4
---

Wonka, in essence, can be used to create sources, to transform sources with operators,
and to consume values from a source with sinks.

Looking at the type definition for what a sink is, it's just a function that can be
called with a signal, which is either `Start`, `Push`, or `End`.
Building on that, a source is just a function
that takes a sink and calls it with signals over time. And lastly an operator is
a function that accepts a source, alongside some options most of the time, and returns
a new source.

Wonka comes with plenty of sources, operators, and sinks built in. This section
describes these and explains what they can be used for.

- [Sources](./sources.md) — learn the Wonka source APIs
- [Operators](./operators.md) — learn the Wonka operator APIs
- [Sinks](./sinks.md) — learn the Wonka sink APIs
