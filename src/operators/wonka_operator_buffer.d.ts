import { Source, Operator } from '../wonka_types';

export const buffer: <A>(signal: Source<any>) => Operator<A, A[]>;
