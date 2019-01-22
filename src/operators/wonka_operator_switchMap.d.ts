import { Source, Operator } from '../wonka_types';

export const switchMap: <A, B>(f: (value: A) => Source<B>) => Operator<A, B>;
export const switchAll: <A>(source: Source<Source<A>>) => Source<A>;
