import { Source, Operator } from '../wonka_types';

export const sample: <A>(signal: Source<any>) => Operator<A, A>;
