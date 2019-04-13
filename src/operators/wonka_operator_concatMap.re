open Wonka_types;
open Wonka_helpers;

type concatMapStateT('a) = {
  inputQueue: Rebel.MutableQueue.t('a),
  mutable outerTalkback: (. talkbackT) => unit,
  mutable innerTalkback: (. talkbackT) => unit,
  mutable innerActive: bool,
  mutable closed: bool,
  mutable ended: bool,
};

let concatMap = f =>
  curry(source =>
    curry(sink => {
      let state: concatMapStateT('a) = {
        inputQueue: Rebel.MutableQueue.make(),
        outerTalkback: talkbackPlaceholder,
        innerTalkback: talkbackPlaceholder,
        innerActive: false,
        closed: false,
        ended: false,
      };

      let rec applyInnerSource = innerSource =>
        innerSource((. signal) =>
          switch (signal) {
          | End =>
            state.innerActive = false;
            state.innerTalkback = talkbackPlaceholder;

            switch (Rebel.MutableQueue.pop(state.inputQueue)) {
            | Some(input) => applyInnerSource(f(. input))
            | None when state.ended => sink(. End)
            | None => ()
            };
          | Start(tb) =>
            state.innerActive = true;
            state.innerTalkback = tb;
            tb(. Pull);
          | Push(x) when !state.closed =>
            sink(. Push(x));
            state.innerTalkback(. Pull);
          | Push(_) => ()
          }
        );

      source((. signal) =>
        switch (signal) {
        | End when !state.ended =>
          state.ended = true;
          if (!state.innerActive
              && Rebel.MutableQueue.isEmpty(state.inputQueue)) {
            sink(. End);
          };
        | End => ()
        | Start(tb) =>
          state.outerTalkback = tb;
          tb(. Pull);
        | Push(x) when !state.ended =>
          if (state.innerActive) {
            Rebel.MutableQueue.add(state.inputQueue, x);
          } else {
            applyInnerSource(f(. x));
          };

          state.outerTalkback(. Pull);
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Pull =>
              if (!state.ended) {
                state.innerTalkback(. Pull);
              }
            | Close =>
              state.innerTalkback(. Close);
              if (!state.ended) {
                state.ended = true;
                state.closed = true;
                state.outerTalkback(. Close);
                state.innerTalkback = talkbackPlaceholder;
              };
            },
        ),
      );
    })
  );

let concatAll = source => concatMap((. x) => x, source);

let concat = sources => {
  Wonka_source_fromArray.(concatMap((. x) => x, fromArray(sources)));
};
