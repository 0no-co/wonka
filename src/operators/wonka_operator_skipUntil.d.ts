import { Source, Operator } from '../wonka_types';

export const skipUntil: <A>(signal: Source<any>) => Operator<A, A>;
