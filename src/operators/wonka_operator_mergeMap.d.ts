import { Source, Operator } from '../wonka_types';

export const mergeMap: <A, B>(f: (value: A) => Source<B>) => Operator<A, B>;
export const merge: <A>(sources: Array<Source<A>>) => Source<A>;
export const mergeAll: <A>(source: Source<Source<A>>) => Source<A>;
export const flatten: <A>(source: Source<Source<A>>) => Source<A>;
