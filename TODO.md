# Wonka Roadmap for v1

- *new*: Denotes operators that are not implemented in callbag-basics in any form

## Source factories

- [ ] create *new* (helper that is observable like? spec out; not counting)
- [x] fromValue(x) *new* (emits single item)
- [x] empty() *new* (ends immediately)
- [x] never() *new* (never ends, never emits)
- [x] fromArray
- [x] fromList
- [x] fromEvent (fromListener, fromDomEvent)
  - [ ] Maybe support bs-webapi-incubator handlers
- [ ] fromReactEvent *new* (Maybe support synthetic React events)
- [x] fromPromise
- [x] interval

The following methods are descoped as they'd require integration into
more-uncommon BuckleScript bindings:

- ~fromIter~
- ~fromObs~

## Sink factories
- [x] forEach
- [ ] subscribe *needs testing*

## Transformation operators
- [x] map
- [x] scan
- [x] flatten

## Filtering operators

- [x] take
- [x] takeLast(num) *new*
- [x] skip
- [x] skipUntil(source) *new*
- [x] skipWhile(predicate) *new*
- [x] filter
- [x] takeUntil(source) *new*
- [x] takeWhile(predicate) *new*

## Combination factories

- [x] merge
- [x] concat
- [x] combine

## Utilities

- [x] share

The ~pipe~ helper is descoped as it's not necessary thanks to Reason's
built-in pipe operator.

## Backpressure

- [x] debounce(x => t) *new*
- [x] throttle(x => t) *new*
- [ ] delay(t) *new*
- [x] sample(source) *new*

## IO Subjects

- [ ] subjects
- [ ] behaviour subjects
