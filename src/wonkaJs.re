open Wonka_types;

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
