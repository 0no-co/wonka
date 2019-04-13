open Wonka_types;
open Wonka_helpers;

type skipUntilStateT = {
  mutable skip: bool,
  mutable ended: bool,
  mutable gotSignal: bool,
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
};

let skipUntil = notifier =>
  curry(source =>
    curry(sink => {
      let state: skipUntilStateT = {
        skip: true,
        ended: false,
        gotSignal: false,
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
              tb(. Pull);
            | Push(_) =>
              state.skip = false;
              state.notifierTalkback(. Close);
            | End => ()
            }
          );
        | Push(_) when state.skip && !state.ended =>
          state.sourceTalkback(. Pull)
        | Push(_) when !state.ended =>
          state.gotSignal = false;
          sink(. signal);
        | Push(_) => ()
        | End =>
          if (state.skip) {
            state.notifierTalkback(. Close);
          };
          state.ended = true;
          sink(. End);
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close =>
              if (state.skip) {
                state.notifierTalkback(. Close);
              };
              state.ended = true;
              state.sourceTalkback(. Close);
            | Pull when !state.gotSignal && !state.ended =>
              state.gotSignal = true;
              state.sourceTalkback(. Pull);
            | Pull => ()
            },
        ),
      );
    })
  );
