open Wonka_types;

[@genType]
let fromValue = (x: 'a): sourceT('a) =>
  curry(sink => {
    let ended = ref(false);

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Pull when ! ended^ =>
            ended := true;
            sink(. Push(x));
            sink(. End);
          | _ => ()
          },
      ),
    );
  });
