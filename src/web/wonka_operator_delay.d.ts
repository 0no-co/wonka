import { Operator } from '../wonka_types';

export const delay: <A>(duration: number) => Operator<A, A>;
