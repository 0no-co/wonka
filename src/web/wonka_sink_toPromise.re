open Wonka_types;

let toPromise = source => {
  Wonka_operator_takeLast.(
    Js.Promise.make((~resolve, ~reject as _) =>
      takeLast(1, source, (. signal) =>
        switch (signal) {
        | Start(x) => x(. Pull)
        | Push(x) => resolve(. x)
        | End => ()
        }
      )
    )
  );
};
