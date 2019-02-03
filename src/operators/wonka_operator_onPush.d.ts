import { Operator } from '../wonka_types';

export const onPush: <A>(f: (value: A) => void) => Operator<A, A>;
export const tap: <A>(f: (value: A) => void) => Operator<A, A>;
