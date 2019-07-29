open Wonka_types;
open Wonka_helpers;

let fromList = ls =>
  curry(sink => {
    let value = ref(ls);

    makeTrampoline(sink, (.) =>
      switch (value^) {
      | [x, ...rest] =>
        value := rest;
        Some(x);
      | [] => None
      }
    );
  });
