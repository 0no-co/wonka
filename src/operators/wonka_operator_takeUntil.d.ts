import { Source, Operator } from '../wonka_types';

export const takeUntil: <A>(signal: Source<any>) => Operator<A, A>;
