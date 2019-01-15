import { Source, Subscription } from '../wonka_types';

export const subscribe: <A>(f: (x: A) => void) => (source: Source<A>) => Subscription;
export const forEach: <A>(f: (x: A) => void) => (source: Source<A>) => void;
