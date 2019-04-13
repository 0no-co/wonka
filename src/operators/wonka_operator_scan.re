open Wonka_types;

let scan = (f, seed) =>
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
