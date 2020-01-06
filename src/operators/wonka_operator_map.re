open Wonka_types;

[@genType]
let map = (f: (. 'a) => 'b): operatorT('a, 'b) =>
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
