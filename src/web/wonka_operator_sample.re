open Wonka_types;

type sampleStateT('a) = {
  mutable ended: bool,
  mutable value: option('a),
  mutable sourceTalkback: (. talkbackT) => unit,
  mutable notifierTalkback: (. talkbackT) => unit,
};

let sample = notifier =>
  curry(source =>
    curry(sink => {
      let state = {
        ended: false,
        value: None,
        sourceTalkback: (. _: talkbackT) => (),
        notifierTalkback: (. _: talkbackT) => (),
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) => state.sourceTalkback = tb
        | End =>
          state.ended = true;
          state.notifierTalkback(. Close);
          sink(. End);
        | Push(x) => state.value = Some(x)
        }
      );

      notifier((. signal) =>
        switch (signal, state.value) {
        | (Start(tb), _) => state.notifierTalkback = tb
        | (End, _) =>
          state.ended = true;
          state.sourceTalkback(. Close);
          sink(. End);
        | (Push(_), Some(x)) when !state.ended =>
          state.value = None;
          sink(. Push(x));
        | (Push(_), _) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Pull =>
              state.sourceTalkback(. Pull);
              state.notifierTalkback(. Pull);
            | Close =>
              state.ended = true;
              state.sourceTalkback(. Close);
              state.notifierTalkback(. Close);
            },
        ),
      );
    })
  );
