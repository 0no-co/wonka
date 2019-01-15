import { Source, Subscription } from '../wonka_types';

export const publish: <A>(source: Source<A>) => Subscription;
