import { Source } from '../wonka_types';

export const combine: <A, B>(a: Source<A>) => (b: Source<B>) => Source<[A, B]>;
