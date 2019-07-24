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

As shown, the sink is just a function accepting a signal as its argument.

When the stream starts then the sink is called with `Start`,
Then for every incoming, new value it's called with `Push('a)`,
and when the stream ends it's finally called with `End`.

Since we want a source to send these values to the sink, the source is
also just a function and it accepts a sink as its argument.

``` reason
type sourceT('a) = sinkT('a) => unit;
```

This is completely sufficient to represent simple "push" streams, where
values are pushed from the source to the sink. They essentially flow from
the "top" to the "bottom".

Operators are just functions that transform a source. They take a
source and some number of arguments and return a new source.
Internally they may also create a new sink function that wraps the
sink that their source will be called with.

The type signature of an operator with no other arguments is thus:

``` reason
type operatorT('a, 'b) = sourceT('a) => sourceT('b);
/* which is the same as: */
type operatorT('a, 'b) = (sourceT('a), sinkT('b)) => unit;
```

## Adding Callbacks

To complete this pattern we're still missing a single piece: callbacks!

Previously, we've looked at how sources are functions that accept sinks, which
in turn are functions accepting a signal. What we're now missing is what makes
Wonka's streams also work as iterables.

We'd also like to be able to _cancel_ streams, so that we can interrupt
them and not receive any more values.

We can achieve this by passing a callback function on when a stream starts.
In Wonka, a sink's `Start` signal also carries a callback that is used to communicate
back to the source, making these "talkback signals" flow from the bottom to the top.

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
callback definition now. The callback accepts one of two signals: `Pull` or `Close`.

`Close` is a signal that will cancel the stream. It tells the source to stop sending
new values.

The `Pull` signal is a signal that asks the source to send the next value. This is
especially useful to represent iterables. In practice a user would never send this
signal explicitly, but sinks would send the signal automatically after receiving the
previous value from the stream.

In asynchronous streams the `Pull` signal is of course a no-op. It won't do
anything since we can't ask for asynchronous values.

## Comparison to Callbags

This is the full pattern of Wonka's streams and it's a little different from callbags.
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
