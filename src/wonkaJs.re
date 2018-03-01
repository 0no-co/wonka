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
