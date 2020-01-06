open Wonka_types;

[@genType]
let toPromise = (source: sourceT('a)): Js.Promise.t('a) => {
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
