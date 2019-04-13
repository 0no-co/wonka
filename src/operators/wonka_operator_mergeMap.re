open Wonka_types;
open Wonka_helpers;

type mergeMapStateT = {
  mutable outerTalkback: (. talkbackT) => unit,
  mutable innerTalkbacks: Rebel.Array.t((. talkbackT) => unit),
  mutable ended: bool,
};

let mergeMap = f =>
  curry(source =>
    curry(sink => {
      let state: mergeMapStateT = {
        outerTalkback: talkbackPlaceholder,
        innerTalkbacks: Rebel.Array.makeEmpty(),
        ended: false,
      };

      let applyInnerSource = innerSource => {
        let talkback = ref(talkbackPlaceholder);

        innerSource((. signal) =>
          switch (signal) {
          | End =>
            state.innerTalkbacks =
              Rebel.Array.filter(state.innerTalkbacks, x => x !== talkback^);
            if (state.ended && Rebel.Array.size(state.innerTalkbacks) === 0) {
              sink(. End);
            };
          | Start(tb) =>
            talkback := tb;
            state.innerTalkbacks =
              Rebel.Array.append(state.innerTalkbacks, tb);
            tb(. Pull);
          | Push(x) when Rebel.Array.size(state.innerTalkbacks) !== 0 =>
            sink(. Push(x));
            talkback^(. Pull);
          | Push(_) => ()
          }
        );
      };

      source((. signal) =>
        switch (signal) {
        | End when !state.ended =>
          state.ended = true;
          if (Rebel.Array.size(state.innerTalkbacks) === 0) {
            sink(. End);
          };
        | End => ()
        | Start(tb) =>
          state.outerTalkback = tb;
          tb(. Pull);
        | Push(x) when !state.ended =>
          applyInnerSource(f(. x));
          state.outerTalkback(. Pull);
        | Push(_) => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close =>
              Rebel.Array.forEach(state.innerTalkbacks, talkback =>
                talkback(. Close)
              );
              if (!state.ended) {
                state.ended = true;
                state.outerTalkback(. Close);
                Rebel.Array.forEach(state.innerTalkbacks, talkback =>
                  talkback(. Close)
                );
                state.innerTalkbacks = Rebel.Array.makeEmpty();
              };
            | Pull when !state.ended =>
              Rebel.Array.forEach(state.innerTalkbacks, talkback =>
                talkback(. Pull)
              )
            | Pull => ()
            },
        ),
      );
    })
  );

let merge = sources => {
  Wonka_source_fromArray.(mergeMap((. x) => x, fromArray(sources)));
};

let mergeAll = source => mergeMap((. x) => x, source);
let flatten = mergeAll;
