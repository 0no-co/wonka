import { Operator } from '../wonka_types';

export const debounce: <A>(f: (x: A) => number) => Operator<A, A>;
