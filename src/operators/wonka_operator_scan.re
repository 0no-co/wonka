open Wonka_types;

[@genType]
let scan = (f: (. 'acc, 'a) => 'acc, seed: 'acc): operatorT('a, 'acc) =>
  curry(source =>
    curry(sink => {
      let acc = ref(seed);

      source((. signal) =>
        sink(.
          switch (signal) {
          | Push(x) =>
            acc := f(. acc^, x);
            Push(acc^);
          | Start(x) => Start(x)
          | End => End
          },
        )
      );
    })
  );
