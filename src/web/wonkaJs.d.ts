import { Sink, Source, Operator } from '../wonka_types';

export const fromListener: <E>(
  addListener: (cb: (event: E) => void) => void,
  removeListener: (cb: (event: E) => void) => void
) => Source<E>;

export const fromDomEvent: <E>(HTMLElement, string) => Source<E>;
export const interval: (interval: number) => Source<number>;
export const fromPromise: <A>(promise: Promise<A>) => Source<A>;

export const debounce: <A>(f: (x: A) => number) => Operator<A, A>;
export const throttle: <A>(f: (x: A) => number) => Operator<A, A>;
export const sample: <A>(signal: Source<any>) => Operator<A, A>;
export const delay: <A>(duration: number) => Operator<A, A>;

export const toPromise: <A>(source: Source<A>) => Promise<A>;
