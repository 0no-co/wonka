open Wonka_types;
open Wonka_helpers;

let fromArray = arr =>
  curry(sink => {
    let size = Rebel.Array.size(arr);
    let index = ref(0);

    makeTrampoline(sink, (.) =>
      if (index^ < size) {
        let x = Rebel.Array.getUnsafe(arr, index^);
        index := index^ + 1;
        Some(x);
      } else {
        None;
      }
    );
  });
