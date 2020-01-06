open Wonka_types;

[@genType]
let fromListener =
    (
      addListener: ('event => unit) => unit,
      removeListener: ('event => unit) => unit,
    )
    : sourceT('event) =>
  curry(sink => {
    let handler = event => sink(. Push(event));

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => removeListener(handler)
          | _ => ()
          },
      ),
    );

    addListener(handler);
  });
