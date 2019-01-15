import { Source, Observer } from '../wonka_types';

export const make: <A>(f: (observer: Observer<A>) => (() => void)) => Source<A>;
