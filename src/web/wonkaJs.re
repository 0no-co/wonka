open Wonka_types;

[@genType]
let fromObservable = Wonka_observable.fromObservable;
let toObservable = Wonka_observable.toObservable;

[@genType]
let fromCallbag = Wonka_callbag.fromCallbag;
let toCallbag = Wonka_callbag.toCallbag;

/* operators */

[@genType]
let debounce = (f: (. 'a) => int): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let gotEndSignal = ref(false);
      let id: ref(option(Js.Global.timeoutId)) = ref(None);

      let clearTimeout = () =>
        switch (id^) {
        | Some(timeoutId) =>
          id := None;
          Js.Global.clearTimeout(timeoutId);
        | None => ()
        };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Close =>
                  clearTimeout();
                  tb(. Close);
                | _ => tb(. signal)
                },
            ),
          )
        | Push(x) =>
          clearTimeout();
          id :=
            Some(
              Js.Global.setTimeout(
                () => {
                  id := None;
                  sink(. signal);
                  if (gotEndSignal^) {
                    sink(. End);
                  };
                },
                f(. x),
              ),
            );
        | End =>
          gotEndSignal := true;

          switch (id^) {
          | None => sink(. End)
          | _ => ()
          };
        }
      );
    })
  );

type delayStateT = {
  mutable talkback: (. talkbackT) => unit,
  mutable active: int,
  mutable gotEndSignal: bool,
};

[@genType]
let delay = (wait: int): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let state: delayStateT = {
        talkback: Wonka_helpers.talkbackPlaceholder,
        active: 0,
        gotEndSignal: false,
      };

      source((. signal) =>
        switch (signal) {
        | Start(tb) => state.talkback = tb
        | _ when !state.gotEndSignal =>
          state.active = state.active + 1;
          ignore(
            Js.Global.setTimeout(
              () => {
                if (state.gotEndSignal && state.active === 0) {
                  sink(. End);
                } else {
                  state.active = state.active - 1;
                };

                sink(. signal);
              },
              wait,
            ),
          );
        | _ => ()
        }
      );

      sink(.
        Start(
          (. signal) =>
            switch (signal) {
            | Close =>
              state.gotEndSignal = true;
              if (state.active === 0) {
                sink(. End);
              };
            | _ when !state.gotEndSignal => state.talkback(. signal)
            | _ => ()
            },
        ),
      );
    })
  );

[@genType]
let throttle = (f: (. 'a) => int): operatorT('a, 'a) =>
  curry(source =>
    curry(sink => {
      let skip = ref(false);
      let id: ref(option(Js.Global.timeoutId)) = ref(None);
      let clearTimeout = () =>
        switch (id^) {
        | Some(timeoutId) => Js.Global.clearTimeout(timeoutId)
        | None => ()
        };

      source((. signal) =>
        switch (signal) {
        | Start(tb) =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Close =>
                  clearTimeout();
                  tb(. Close);
                | _ => tb(. signal)
                },
            ),
          )
        | End =>
          clearTimeout();
          sink(. End);
        | Push(x) when ! skip^ =>
          skip := true;
          clearTimeout();
          id :=
            Some(
              Js.Global.setTimeout(
                () => {
                  id := None;
                  skip := false;
                },
                f(. x),
              ),
            );
          sink(. signal);
        | Push(_) => ()
        }
      );
    })
  );

/* sinks */
[@genType]
let toPromise = (source: sourceT('a)): Js.Promise.t('a) => {
  Js.Promise.make((~resolve, ~reject as _) =>
    Wonka_operators.takeLast(1, source, (. signal) =>
      switch (signal) {
      | Start(x) => x(. Pull)
      | Push(x) => resolve(. x)
      | End => ()
      }
    )
  );
};

/* sources */
[@genType]
let interval = (p: int): sourceT(int) =>
  curry(sink => {
    let i = ref(0);
    let id =
      Js.Global.setInterval(
        () => {
          let num = i^;
          i := i^ + 1;
          sink(. Push(num));
        },
        p,
      );

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => Js.Global.clearInterval(id)
          | _ => ()
          },
      ),
    );
  });

[@genType]
let fromDomEvent = (element: Dom.element, event: string): sourceT(Dom.event) =>
  curry(sink => {
    let addEventListener: (Dom.element, string, Dom.event => unit) => unit = [%raw
      {|
    function (element, event, handler) {
      element.addEventListener(event, handler);
    }
  |}
    ];

    let removeEventListener: (Dom.element, string, Dom.event => unit) => unit = [%raw
      {|
    function (element, event, handler) {
      element.removeEventListener(event, handler);
    }
  |}
    ];

    let handler = event => sink(. Push(event));

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => removeEventListener(element, event, handler)
          | _ => ()
          },
      ),
    );

    addEventListener(element, event, handler);
  });

[@genType]
let fromPromise = (promise: Js.Promise.t('a)): sourceT('a) =>
  curry(sink => {
    let ended = ref(false);

    ignore(
      Js.Promise.then_(
        value => {
          if (! ended^) {
            sink(. Push(value));
            sink(. End);
          };

          Js.Promise.resolve();
        },
        promise,
      ),
    );

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => ended := true
          | _ => ()
          },
      ),
    );
  });
