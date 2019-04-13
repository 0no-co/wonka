open Wonka_types;
open Wonka_helpers;

let takeLast = max =>
  curry(source =>
    curry(sink => {
      open Rebel;
      let queue = MutableQueue.make();

      captureTalkback(source, (. signal, talkback) =>
        switch (signal) {
        | Start(_) => talkback(. Pull)
        | Push(x) =>
          let size = MutableQueue.size(queue);
          if (size >= max && max > 0) {
            ignore(MutableQueue.pop(queue));
          };

          MutableQueue.add(queue, x);
          talkback(. Pull);
        | End => makeTrampoline(sink, (.) => MutableQueue.pop(queue))
        }
      );
    })
  );
