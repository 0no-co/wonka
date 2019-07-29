open Wonka_types;
open Wonka_helpers;

type toArrayStateT('a) = {
  mutable talkback: (. talkbackT) => unit,
  values: Rebel.MutableQueue.t('a),
  mutable value: option('a),
  mutable ended: bool,
};

let toArray = (source: sourceT('a)): array('a) => {
  let state: toArrayStateT('a) = {
    talkback: talkbackPlaceholder,
    values: Rebel.MutableQueue.make(),
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

  Rebel.MutableQueue.toArray(state.values);
};
