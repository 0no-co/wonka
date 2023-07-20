---
'wonka': patch
---

Improve compatibility of `fromAsyncIterable` and `toAsyncIterable`. The `toAsyncIterable` will now output an object that's both an `AsyncIterator` and an `AsyncIterable`. Both helpers will now use a polyfill for `Symbol.asyncIterator` to improve compatibility with the Hermes engine and Babel transpilation.
