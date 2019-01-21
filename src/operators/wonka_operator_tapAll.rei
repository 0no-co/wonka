open Wonka_types;

let tapAll: (
  ~onStart: (.unit) => unit,
  ~onPush: (.'a) => unit,
  ~onEnd: (.unit) => unit,
  sourceT('a),
  sinkT('a)
) => unit;
