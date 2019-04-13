open Wonka_types;

let fromListener = (addListener, removeListener) =>
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
