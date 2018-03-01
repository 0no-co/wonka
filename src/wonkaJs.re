open Wonka_types;

let fromListener = (addListener, removeListener, sink) => {
  let handler = event => sink(Push(event));
  sink(Start(signal => {
    switch (signal) {
    | End => removeListener(handler)
    | _ => ()
    }
  }));
  addListener(handler);
};

let fromDomEvent = (element, event, sink) => {
  let addEventListener: (
    Dom.element,
    string,
    (Dom.event) => unit
  ) => unit = [%raw {|
    function (element, event, handler) {
      element.addEventListener(event, handler);
    }
  |}];

  let removeEventListener: (
    Dom.element,
    string,
    (Dom.event) => unit
  ) => unit = [%raw {|
    function (element, event, handler) {
      element.addEventListener(event, handler);
    }
  |}];

  fromListener(
    handler => addEventListener(element, event, handler),
    handler => removeEventListener(element, event, handler),
    sink
  )
};

let interval = (p, sink) => {
  let i = ref(0);
  let id = Js.Global.setInterval(() => {
    let num = i^;
    i := i^ + 1;
    sink(Push(num));
  }, p);

  sink(Start(signal => {
    switch (signal) {
    | End => Js.Global.clearInterval(id)
    | _ => ()
    }
  }));
};

let fromPromise = (promise, sink) => {
  let ended = ref(false);

  ignore(Js.Promise.then_(value => {
    if (!ended^) {
      sink(Push(value));
      sink(End);
    };

    Js.Promise.resolve(())
  }, promise));

  sink(Start(signal => {
    switch (signal) {
    | End => ended := true
    | _ => ()
    }
  }));
};

let debounce = (debounceF, source, sink) => {
  let gotEndSignal = ref(false);
  let id: ref(option(Js.Global.timeoutId)) = ref(None);

  let clearTimeout = () =>
    switch (id^) {
    | Some(timeoutId) => {
      id := None;
      Js.Global.clearTimeout(timeoutId);
    }
    | None => ()
    };

  source(signal => {
    switch (signal) {
    | Start(tb) => {
      sink(Start(signal => {
        switch (signal) {
        | End => {
          clearTimeout();
          tb(End);
        }
        | _ => tb(signal)
        }
      }));
    }
    | Push(x) => {
      clearTimeout();
      id := Some(Js.Global.setTimeout(() => {
        id := None;
        sink(signal);
        if (gotEndSignal^) sink(End);
      }, debounceF(x)));
    }
    | End => {
      gotEndSignal := true;

      switch (id^) {
      | None => sink(End)
      | _ => ()
      };
    }
    }
  });
};

let throttle = (throttleF, source, sink) => {
  let skip = ref(false);
  let id: ref(option(Js.Global.timeoutId)) = ref(None);
  let clearTimeout = () =>
    switch (id^) {
    | Some(timeoutId) => Js.Global.clearTimeout(timeoutId);
    | None => ()
    };

  source(signal => {
    switch (signal) {
    | Start(tb) => {
      sink(Start(signal => {
        switch (signal) {
        | End => {
          clearTimeout();
          tb(End);
        }
        | _ => tb(signal)
        }
      }));
    }
    | End => {
      clearTimeout();
      sink(End);
    }
    | Push(x) when !skip^ => {
      skip := true;
      clearTimeout();
      id := Some(Js.Global.setTimeout(() => {
        id := None;
        skip := false;
      }, throttleF(x)));
      sink(signal);
    }
    | Push(_) => ()
    }
  });
};
