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
    | Start(x) => state.talkback = x
    | Push(x) => state.value = Some(x)
    | End => state.ended = true
    }
  );

  while (!state.ended) {
    state.talkback(. Pull);
    switch (state.value) {
    | Some(value) =>
      Rebel.MutableQueue.add(state.values, value);
      state.value = None;
    | None when !state.ended =>
      state.ended = true;
      state.talkback(. Close);
    | None => ()
    };
  };

  Rebel.MutableQueue.toArray(state.values);
};
