import { Operator } from '../wonka_types';

export const tap: <A>(f: (value: A) => void) => Operator<A, A>;
