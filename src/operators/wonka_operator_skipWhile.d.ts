import { Operator } from '../wonka_types';

export const skipWhile: <A>(f: (x: A) => boolean) => Operator<A, A>;
