import { Operator } from '../wonka_types';

export const scan: <A, B>(f: (acc: B, value: A) => B, acc: B) => Operator<A, B>;
