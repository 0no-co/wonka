import { Operator } from '../wonka_types';

export const take: <A>(max: number) => Operator<A, A>;
