import { Source, Operator } from '../wonka_types';

export const concatMap: <A, B>(f: (value: A) => Source<B>) => Operator<A, B>;
export const concat: <A>(sources: Array<Source<A>>) => Source<A>;
export const concatAll: <A>(source: Source<Source<A>>) => Source<A>;
