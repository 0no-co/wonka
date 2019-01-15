import { Operator } from '../wonka_types';

export const filter: <A>(f: (value: A) => boolean) => Operator<A, A>;
