open Wonka_types;

let onEnd = f => curry(source => curry(sink => {
  let ended = ref(false);

  source((.signal) => {
    switch (signal) {
    | Start(talkback) => {
      sink(.Start((.signal) => {
        talkback(.signal);

        if (!ended^) {
          ended := true;
          f(.);
        }
      }));
    }
    | End => {
      if (!ended^) {
        ended := true;
        sink(.signal);
        f(.);
      }
    }
    | _ => sink(.signal)
    };
  });
}));
