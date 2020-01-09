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
          | Pull => ()
          | Close => ended := true
          },
      ),
    );
  });

type makeStateT = {
  mutable teardown: (. unit) => unit,
  mutable ended: bool,
};

[@genType]
let make = (f: (. observerT('a)) => teardownT): sourceT('a) =>
  curry(sink => {
    let state: makeStateT = {teardown: (.) => (), ended: false};

    state.teardown =
      f(. {
        next: value =>
          if (!state.ended) {
            sink(. Push(value));
          },
        complete: () =>
          if (!state.ended) {
            state.ended = true;
            sink(. End);
          },
      });

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close when !state.ended =>
            state.ended = true;
            state.teardown(.);
          | _ => ()
          },
      ),
    );
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
          switch (signal) {
          | Close =>
            state.sinks = Rebel.Array.filter(state.sinks, x => x !== sink)
          | _ => ()
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
  let ended = ref(false);
  sink(.
    Start(
      (. signal) => {
        switch (signal) {
        | Close => ended := true
        | Pull when ! ended^ => sink(. End)
        | _ => ()
        }
      },
    ),
  );
};

[@genType]
let never = (sink: sinkT('a)): unit => {
  sink(. Start(talkbackPlaceholder));
};
