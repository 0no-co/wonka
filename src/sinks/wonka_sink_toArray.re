open Wonka_types;
open Wonka_helpers;

type toArrayStateT('a) = {
  values: Rebel.MutableQueue.t('a),
  mutable talkback: (. talkbackT) => unit,
  mutable value: option('a),
  mutable ended: bool,
};

let toArray = (source: sourceT('a)): array('a) => {
  let state: toArrayStateT('a) = {
    values: Rebel.MutableQueue.make(),
    talkback: talkbackPlaceholder,
    value: None,
    ended: false,
  };

  source((. signal) =>
    switch (signal) {
    | Start(x) =>
      state.talkback = x;
      x(. Pull);
    | Push(value) =>
      Rebel.MutableQueue.add(state.values, value);
      state.talkback(. Pull);
    | End => state.ended = true
    }
  );

  if (!state.ended) {
    state.talkback(. Close);
  };

  Rebel.MutableQueue.toArray(state.values);
};
