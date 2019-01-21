import { Operator } from '../wonka_types';

export const tapAll: <A>(
  onStart: () => void,
  onPush: (value: A) => void,
  onEnd: () => void
) => Operator<A, A>;
