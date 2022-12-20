---
'wonka': patch
---

Fix promise timing by adding missing `Promise.resolve()` tick to `toPromise` sink function.
