import { Source } from '../wonka_types';

export const toPromise: <A>(source: Source<A>) => Promise<A>;
