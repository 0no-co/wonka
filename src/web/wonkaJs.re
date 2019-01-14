open Wonka_types;

let fromListener = (addListener, removeListener) => curry(sink => {
  let handler = event => sink(.Push(event));

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => removeListener(handler)
    | _ => ()
    }
  }));

  addListener(handler);
});

let fromDomEvent = (element, event) => curry(sink => {
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
      element.removeEventListener(event, handler);
    }
  |}];

  fromListener(
    handler => addEventListener(element, event, handler),
    handler => removeEventListener(element, event, handler),
    sink
  )
});

let interval = p => curry(sink => {
  let i = ref(0);
  let id = Js.Global.setInterval(() => {
    let num = i^;
    i := i^ + 1;
    sink(.Push(num));
  }, p);

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => Js.Global.clearInterval(id)
    | _ => ()
    }
  }));
});

let fromPromise = promise => curry(sink => {
  let ended = ref(false);

  ignore(Js.Promise.then_(value => {
    if (!ended^) {
      sink(.Push(value));
      sink(.End);
    };

    Js.Promise.resolve(())
  }, promise));

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => ended := true
    | _ => ()
    }
  }));
});

let debounce = debounceF => curry(source => curry(sink => {
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

  source((.signal) => {
    switch (signal) {
    | Start(tb) => {
      sink(.Start((.signal) => {
        switch (signal) {
        | Close => {
          clearTimeout();
          tb(.Close);
        }
        | _ => tb(.signal)
        }
      }));
    }
    | Push(x) => {
      clearTimeout();
      id := Some(Js.Global.setTimeout(() => {
        id := None;
        sink(.signal);
        if (gotEndSignal^) sink(.End);
      }, debounceF(x)));
    }
    | End => {
      gotEndSignal := true;

      switch (id^) {
      | None => sink(.End)
      | _ => ()
      };
    }
    }
  });
}));

let throttle = throttleF => curry(source => curry(sink => {
  let skip = ref(false);
  let id: ref(option(Js.Global.timeoutId)) = ref(None);
  let clearTimeout = () =>
    switch (id^) {
    | Some(timeoutId) => Js.Global.clearTimeout(timeoutId);
    | None => ()
    };

  source((.signal) => {
    switch (signal) {
    | Start(tb) => {
      sink(.Start((.signal) => {
        switch (signal) {
        | Close => {
          clearTimeout();
          tb(.Close);
        }
        | _ => tb(.signal)
        }
      }));
    }
    | End => {
      clearTimeout();
      sink(.End);
    }
    | Push(x) when !skip^ => {
      skip := true;
      clearTimeout();
      id := Some(Js.Global.setTimeout(() => {
        id := None;
        skip := false;
      }, throttleF(x)));
      sink(.signal);
    }
    | Push(_) => ()
    }
  });
}));

type sampleStateT('a) = {
  mutable ended: bool,
  mutable value: option('a),
  mutable sourceTalkback: (.talkbackT) => unit,
  mutable notifierTalkback: (.talkbackT) => unit
};

let sample = notifier => curry(source => curry(sink => {
  let state = {
    ended: false,
    value: None,
    sourceTalkback: (._: talkbackT) => (),
    notifierTalkback: (._: talkbackT) => ()
  };

  source((.signal) => {
    switch (signal) {
    | Start(tb) => state.sourceTalkback = tb
    | End => {
      state.ended = true;
      state.notifierTalkback(.Close);
      sink(.End);
    }
    | Push(x) => state.value = Some(x)
    }
  });

  notifier((.signal) => {
    switch (signal, state.value) {
    | (Start(tb), _) => state.notifierTalkback = tb
    | (End, _) => {
      state.ended = true;
      state.sourceTalkback(.Close);
      sink(.End);
    }
    | (Push(_), Some(x)) when !state.ended => {
      state.value = None;
      sink(.Push(x));
    }
    | (Push(_), _) => ()
    }
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Pull => {
      state.sourceTalkback(.Pull);
      state.notifierTalkback(.Pull);
    }
    | Close => {
      state.ended = true;
      state.sourceTalkback(.Close);
      state.notifierTalkback(.Close);
    }
    }
  }));
}));

type delayStateT = {
  mutable talkback: (.talkbackT) => unit,
  mutable active: int,
  mutable gotEndSignal: bool
};

let delay = wait => curry(source => curry(sink => {
  let state: delayStateT = {
    talkback: Wonka_helpers.talkbackPlaceholder,
    active: 0,
    gotEndSignal: false
  };

  source((.signal) => {
    switch (signal) {
    | Start(tb) => state.talkback = tb
    | _ when !state.gotEndSignal => {
      state.active = state.active + 1;
      ignore(Js.Global.setTimeout(() => {
        if (state.gotEndSignal && state.active === 0) {
          sink(.End);
        } else {
          state.active = state.active - 1;
        };

        sink(.signal);
      }, wait));
    }
    | _ => ()
    }
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => {
      state.gotEndSignal = true;
      if (state.active === 0) sink(.End);
    }
    | _ when !state.gotEndSignal => state.talkback(.signal)
    | _ => ()
    }
  }));
}));

let toPromise = source =>
  Js.Promise.make((~resolve, ~reject as _) => {
    Wonka.takeLast(1, source, (.signal) => {
      switch (signal) {
      | Start(x) => x(.Pull)
      | Push(x) => resolve(.x)
      | End => ()
      }
    });
  });
