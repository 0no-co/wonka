open Wonka_types;

let tapAll = (~onStart, ~onPush, ~onEnd) => {
  curry(source => curry(sink => {
    let ended = ref(false);

    source((.signal) => {
      switch (signal) {
      | Start(talkback) => {
        onStart(.)

        sink(.Start((.signal) => {
          switch (signal) {
          | Close when !ended^ => {
            ended := true;
            onEnd(.);
          }
          | Close => ()
          | _ => talkback(.signal)
          }
        }));
      }
      | Push(x) => {
        onPush(.x)
        sink(.signal);
      }
      | End when !ended^ => {
        ended := true;
        onEnd(.)
      }
      | _ => ()
      };

    });
  }));
};
