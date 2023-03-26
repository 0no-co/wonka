---
'wonka': patch
---

Convert `Push<T>` and `Start<T>` signals to `{ tag, 0: value }` objects, which are sufficiently backwards compatible and result in slightly faster execution in v8.
