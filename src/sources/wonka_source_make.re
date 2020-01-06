open Wonka_types;

[@genType]
let make = (f: (. observerT('a)) => teardownT): sourceT('a) =>
  curry(sink => {
    let teardown = ref((.) => ());

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => teardown^(.)
          | Pull => ()
          },
      ),
    );

    teardown :=
      f(. {
        next: value => sink(. Push(value)),
        complete: () => sink(. End),
      });
  });
