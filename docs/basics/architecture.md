---
title: Architecture
order: 1
---

It may be useful to understand how Wonka's sources work internally
if you want to write a new operator from scratch or contribute to it.

This section explains how Wonka works internally and how it differs from
the callbag specification.

## Just Functions

Internally Wonka only uses functions with rather simple signatures to
make its streams work.

We have sinks on one end, which need to receive values, and sources
on the other, which need to send values.
The sink is therefore just a function that we call with values over time.
This is called a "push" signal.

Because a sink has a start, incoming values, and an end, there are three
signals that a sink can receive: `Start`, `Push`, and `End`.

``` reason
type signalT('a) =
  | Start
  | Push('a)
  | End;

type sinkT('a) = (. signalT('a)) => unit;
```

So the sink is just a function of `sinkT('a)`, which accepts a signal. When
the stream starts then the sink is called with `Start`, when a new value
comes in then the sink is called with `Push('a)`, and when the stream ends
the sink is called with `End`.

Since we want a source to send these values to the sink, the source is
also just a function and it accepts a sink as its argument.

``` reason
type sourceT('a) = sinkT('a) => unit;
```

This is completely sufficient to represent simple "push" streams, where
values are pushed to the sink. They essentially flow from the "top" to the
"bottom".

If we now think of operators, those are just functions that accept a
source and return a new source. They wrap sources and may also
wrap the sink that their sources are called with.

To put this simply though, an operator with no other arguments will
just accept a source and return a source:

``` reason
type operatorT('a, 'b) = sourceT('a) => sourceT('b);
// which is the same as:
type operatorT('a, 'b) = (sourceT('a), sinkT('b)) => unit;
```

## Adding Callbacks

To complete this pattern we're still missing a single piece: callbacks!

Before we've shown how sources are functions that accept sinks. These sources
can push values down to the sink by calling it with signals.
What we're now missing though is what makes Wonka's streams also work as
iterables. We'd also like to be able to _cancel_ streams, so that we can interrupt
them and not receive any more values.

We achieve this by passing a callback function when a stream starts. The sink's
`Start` signal also carries a callback that is used to communicate back to the
source, making these "talkback signals" flow from the bottom to the top, in reverse.

``` reason
type talkbackT =
  | Pull
  | Close;

type signalT('a) =
  | Start((. talkbackT) => unit)
  | Push('a)
  | End;
```

This is like the previous `signalT('a)` definition, but the `Start` signal has the
callback definition now. The callback accepts two signals: `Pull` or `Close`.

`Close` is a signal that will cancel the stream. It tells the source to stop sending
new values.

The `Pull` signal is a signal that asks the source to send the next value. This is
especially useful to represent iterables. In practice a user would never send this
signal explicitly, but sinks would send the signal automatically after receiving the
previous value from the stream.

In asynchronous streams the `Pull` signal is of course a no-op. It won't do
anything since we can't ask for asynchronous values.

## Differences to Callbags

This is the full pattern of Wonka's streams and it's a little different to callbags.
These changes have been made to make Wonka's streams typesafe. But there's
also a small omission that makes Wonka's streams easier to explain.

In Callbags, sources don't just accept sinks as their only argument. In fact, in
callbags the source would also receive three different signals. This can be useful
to represent "subjects".

A subject is a sink and source combined. It can be used to dispatch values imperatively,
like an event dispatcher.

In Wonka there's a separate type for subjects however, since this reduces the
complexity of its streams a lot:

``` reason
type subjectT('a) = {
  source: sourceT('a),
  next: 'a => unit,
  complete: unit => unit,
};
```

Hence in Wonka a subject is simply a wrapper around a source and a `next` and `complete`
method.
