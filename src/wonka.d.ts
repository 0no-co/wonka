import { List, Sink, Source, Operator } from './wonka_types';

export const create: <A>(gen: () => void | A) => Sink<A>;
export const fromList: <A>(list: List<A>) => Sink<A>;
export const fromArray: <A>(array: A[]) => Sink<A>;
export const fromValue: <A>(value: A) => Sink<A>;
export const empty: Sink<{}>;
export const never: Sink<{}>;

export const map: <A, B>(transform: (value: A) => B) => Operator<A, B>;
export const filter: <A>(predicate: (value: A) => boolean) => Operator<A, A>;
export const scan: <A, B>(accumulator: (acc: B, value: A) => B, initial: B) => Operator<A, B>;

export const merge: <A>(sources: Array<Source<A>>) => Sink<A>;
export const concat: <A>(sources: Array<Source<A>>) => Sink<A>;
export const share: <A>(source: Source<A>) => Sink<A>;
export const combine: <A, B>(a: Source<A>, b: Source<B>) => Sink<[A, B]>;

export const take: <A>(limit: number) => Operator<A, A>;
export const takeLast: <A>(limit: number) => Operator<A, A>;
export const takeWhile: <A>(predicate: (value: A) => boolean) => Operator<A, A>;
export const takeUntil: <A>(signal: Source<any>) => Operator<A, A>;
export const skip: <A>(limit: number) => Operator<A, A>;
export const skipWhile: <A>(predicate: (value: A) => boolean) => Operator<A, A>;
export const skipUntil: <A>(signal: Source<any>) => Operator<A, A>;

export const flatten: <A>(source: Source<Source<A>[]>) => Sink<A>;

export const forEach: <A>(fn: (value: A) => void, source: Source<A>) => void;
export const subscribe: <A>(fn: (value: A) => void, source: Source<A>) => (() => void);
