import { Operator } from '../wonka_types';

export const throttle: <A>(f: (x: A) => number) => Operator<A, A>;
