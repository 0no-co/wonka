---
'wonka': patch
---

Fix `zip`/`combine` iterating inherited `Array.prototype` properties by replacing `for...in` with `for...of Object.keys()`.
