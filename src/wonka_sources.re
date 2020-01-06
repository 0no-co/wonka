open Wonka_types;
open Wonka_helpers;

[@genType]
let fromArray = (arr: array('a)): sourceT('a) =>
  curry(sink => {
    let size = Rebel.Array.size(arr);
    let index = ref(0);

    makeTrampoline(sink, (.) =>
      if (index^ < size) {
        let x = Rebel.Array.getUnsafe(arr, index^);
        index := index^ + 1;
        Some(x);
      } else {
        None;
      }
    );
  });

[@genType]
let fromList = (ls: list('a)): sourceT('a) =>
  curry(sink => {
    let value = ref(ls);

    makeTrampoline(sink, (.) =>
      switch (value^) {
      | [x, ...rest] =>
        value := rest;
        Some(x);
      | [] => None
      }
    );
  });

[@genType]
let fromValue = (x: 'a): sourceT('a) =>
  curry(sink => {
    let ended = ref(false);

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Pull when ! ended^ =>
            ended := true;
            sink(. Push(x));
            sink(. End);
          | _ => ()
          },
      ),
    );
  });

[@genType]
let make = (f: (. observerT('a)) => teardownT): sourceT('a) =>
  curry(sink => {
    let teardown = ref((.) => ());

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => teardown^(.)
          | Pull => ()
          },
      ),
    );

    teardown :=
      f(. {
        next: value => sink(. Push(value)),
        complete: () => sink(. End),
      });
  });

type subjectState('a) = {
  mutable sinks: Rebel.Array.t(sinkT('a)),
  mutable ended: bool,
};

[@genType]
let makeSubject = (): subjectT('a) => {
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

[@genType]
let empty = (sink: sinkT('a)): unit => {
  sink(. Start(talkbackPlaceholder));
  sink(. End);
};

[@genType]
let never = (sink: sinkT('a)): unit => {
  sink(. Start(talkbackPlaceholder));
};
