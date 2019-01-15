open Wonka_types;

let make = f => curry(sink => {
  let teardown = f(.{
    next: value => sink(.Push(value)),
    complete: () => sink(.End)
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => teardown(.)
    | Pull => ()
    }
  }));
});
