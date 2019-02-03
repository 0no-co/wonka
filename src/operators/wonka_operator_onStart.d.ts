import { Operator } from '../wonka_types';

export const onStart: <A>(f: (value: A) => void) => Operator<A, A>;
