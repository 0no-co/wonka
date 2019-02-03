import { Operator } from '../wonka_types';

export const onEnd: <A>(f: (value: A) => void) => Operator<A, A>;
