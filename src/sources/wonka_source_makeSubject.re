open Wonka_types;

type subjectState('a) = {
  mutable sinks: Rebel.Array.t(sinkT('a)),
  mutable ended: bool,
};

let makeSubject = () => {
  let state: subjectState('a) = {
    sinks: Rebel.Array.makeEmpty(),
    ended: false,
  };

  let source = sink => {
    state.sinks = Rebel.Array.append(state.sinks, sink);
    sink(.
      Start(
        (. signal) =>
          if (signal === Close) {
            state.sinks = Rebel.Array.filter(state.sinks, x => x !== sink);
          },
      ),
    );
  };

  let next = value =>
    if (!state.ended) {
      Rebel.Array.forEach(state.sinks, sink => sink(. Push(value)));
    };

  let complete = () =>
    if (!state.ended) {
      state.ended = true;
      Rebel.Array.forEach(state.sinks, sink => sink(. End));
    };

  {source, next, complete};
};
