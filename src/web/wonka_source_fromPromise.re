open Wonka_types;

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
