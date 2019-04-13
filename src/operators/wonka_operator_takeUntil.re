open Wonka_types;
open Wonka_helpers;

type takeUntilStateT = {
  mutable ended: bool,
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
};

let takeUntil = notifier =>
  curry(source =>
    curry(sink => {
      let state: takeUntilStateT = {
        ended: false,
        sourceTalkback: talkbackPlaceholder,
        notifierTalkback: talkbackPlaceholder,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          state.sourceTalkback = tb;

          notifier((. signal) =>
            switch (signal) {
            | Start(innerTb) =>
              state.notifierTalkback = innerTb;
              innerTb(. Pull);
            | Push(_) =>
              state.ended = true;
              state.notifierTalkback(. Close);
              state.sourceTalkback(. Close);
              sink(. End);
            | End => ()
            }
          );
        | End when !state.ended =>
          state.notifierTalkback(. Close);
          state.ended = true;
          sink(. End);
        | End => ()
        | Push(_) when !state.ended => sink(. signal)
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            if (!state.ended) {
              switch (signal) {
              | Close =>
                state.sourceTalkback(. Close);
                state.notifierTalkback(. Close);
              | Pull => state.sourceTalkback(. Pull)
              };
            },
        ),
      );
    })
  );
