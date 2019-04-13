open Wonka_types;

let map = f =>
  curry(source =>
    curry(sink =>
      source((. signal) =>
        sink(.
          switch (signal) {
          | Start(x) => Start(x)
          | Push(x) => Push(f(. x))
          | End => End
          },
        )
      )
    )
  );
