import { Sink, Source, Operator } from './wonka_types';

export const fromListener: <E>(
  addListener: (cb: (event: E) => void) => void,
  removeListener: (cb: (event: E) => void) => void
) => Sink<E>;

export const fromDomEvent: <E>(HTMLElement, string) => Sink<E>;
export const interval: (interval: number) => Sink<number>;
export const fromPromise: <A>(promise: Promise<A>) => Sink<A>;

export const debounce: <A>(withDuration: (value: A) => number) => Operator<A, A>;
export const throttle: <A>(withDuration: (value: A) => number) => Operator<A, A>;
export const sample: <A>(signal: Source<any>) => Operator<A, A>;
export const delay: <A>(duration: number) => Operator<A, A>;
