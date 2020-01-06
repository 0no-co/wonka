open Wonka_types;
open Wonka_helpers;

type bufferStateT('a) = {
  mutable buffer: Rebel.MutableQueue.t('a),
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
  mutable ended: bool,
};

[@genType]
let buffer = (notifier: sourceT('a)): operatorT('b, array('b)) =>
  curry(source =>
    curry(sink => {
      let state = {
        buffer: Rebel.MutableQueue.make(),
        sourceTalkback: talkbackPlaceholder,
        notifierTalkback: talkbackPlaceholder,
        ended: false,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          state.sourceTalkback = tb;

          notifier((. signal) =>
            switch (signal) {
            | Start(tb) =>
              state.notifierTalkback = tb;
              state.notifierTalkback(. Pull);
            | Push(_) when !state.ended =>
              sink(. Push(Rebel.MutableQueue.toArray(state.buffer)));
              state.buffer = Rebel.MutableQueue.make();
              state.notifierTalkback(. Pull);
            | Push(_) => ()
            | End when !state.ended =>
              state.ended = true;
              state.sourceTalkback(. Close);
              sink(. Push(Rebel.MutableQueue.toArray(state.buffer)));
              sink(. End);
            | End => ()
            }
          );
        | Push(value) when !state.ended =>
          Rebel.MutableQueue.add(state.buffer, value);
          state.sourceTalkback(. Pull);
        | Push(_) => ()
        | End when !state.ended =>
          state.ended = true;
          state.notifierTalkback(. Close);
          sink(. Push(Rebel.MutableQueue.toArray(state.buffer)));
          sink(. End);
        | End => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (!state.ended) {
              switch (signal) {
              | Close =>
                state.ended = true;
                state.sourceTalkback(. Close);
                state.notifierTalkback(. Close);
              | Pull => state.sourceTalkback(. Pull)
              };
            },
        ),
      );
    })
  );
