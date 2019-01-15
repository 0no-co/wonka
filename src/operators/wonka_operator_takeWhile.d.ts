import { Operator } from '../wonka_types';

export const takeWhile: <A>(f: (x: A) => boolean) => Operator<A, A>;
