open Wonka_types;
open Wonka_helpers;

[@genType]
let empty: sourceT('a) =
  sink => {
    sink(. Start(talkbackPlaceholder));
    sink(. End);
  };

[@genType]
let never: sourceT('a) =
  sink => {
    sink(. Start(talkbackPlaceholder));
  };
