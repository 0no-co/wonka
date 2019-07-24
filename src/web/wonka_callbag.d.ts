import { Source } from '../wonka_types';

export type Callbag<I, O> = {
  (t: 0, d: Callbag<O, I>): void;
  (t: 1, d: I): void;
  (t: 2, d?: any): void;
};

export const fromCallbag: <T>(callbag: Callbag<void, T>) => Source<T>;
export const toCallbag: <T>(source: Source<T>) => Callbag<void, T>;
