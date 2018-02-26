/*
  A sink has the signature: `signalT('a) => unit`
  A source thus has the signature: `sink => unit`, or `(signalT('a) => unit) => unit`
 */
type talkbackT =
  | Pull
  | End;

type signalT('a) =
  | Start(talkbackT => unit)
  | Push('a)
  | End;
