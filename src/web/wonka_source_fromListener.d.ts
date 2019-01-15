import { Source } from '../wonka_types';

export const fromListener: <E>(
  addListener: (cb: (event: E) => void) => void,
  removeListener: (cb: (event: E) => void) => void
) => Source<E>;
