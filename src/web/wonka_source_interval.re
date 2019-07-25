open Wonka_types;

let interval = p =>
  curry(sink => {
    let i = ref(0);
    let id =
      Js.Global.setInterval(
        () => {
          let num = i^;
          i := i^ + 1;
          sink(. Push(num));
        },
        p,
      );

    sink(.
      Start(
        (. signal) =>
          switch (signal) {
          | Close => Js.Global.clearInterval(id)
          | _ => ()
          },
      ),
    );
  });
