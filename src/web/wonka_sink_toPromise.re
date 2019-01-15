open Wonka_types;

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
