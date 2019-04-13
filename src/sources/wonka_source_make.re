open Wonka_types;

let make = f =>
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
