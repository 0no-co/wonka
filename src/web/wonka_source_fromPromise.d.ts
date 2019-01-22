import { Operator, Source } from '../wonka_types';

export const fromPromise: <A>(promise: Promise<A>) => Source<A>;
