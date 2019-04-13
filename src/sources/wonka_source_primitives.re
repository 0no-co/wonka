open Wonka_types;
open Wonka_helpers;

let empty = sink => {
  sink(. Start(talkbackPlaceholder));
  sink(. End);
};

let never = sink => {
  sink(. Start(talkbackPlaceholder));
};
