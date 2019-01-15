import { Operator } from '../wonka_types';

export const map: <A, B>(f: (value: A) => B) => Operator<A, B>;
