import { List, Sink, Source, Operator } from './wonka_types';

export const fromList: <A>(list: List<A>) => (sink: Sink<A>) => void;
export const fromArray: <A>(array: A[]) => (sink: Sink<A>) => void;
export const fromValue: <A>(value: A) => (sink: Sink<A>) => void;
export const empty: (sink: Sink<{}>) => void;
export const never: (sink: Sink<{}>) => void;

export const map: <A, B>(transform: (value: A) => B) => Operator<A, B>;
export const filter: <A>(predicate: (value: A) => boolean) => Operator<A, A>;
export const scan: <A, B>(accumulator: (acc: B, value: A) => B, initial: B) => Operator<A, B>;

export const merge: <A>(sources: Array<Source<A>>) => (sink: Sink<A>) => void;
export const concat: <A>(sources: Array<Source<A>>) => (sink: Sink<A>) => void;
export const share: <A>(source: Source<A>) => (sink: Sink<A>) => void;
export const combine: <A, B>(a: Source<A>, b: Source<B>) => (sink: Sink<[A, B]>) => void;

export const take: <A>(limit: number) => Operator<A, A>;
export const takeLast: <A>(limit: number) => Operator<A, A>;
export const takeWhile: <A>(predicate: (value: A) => boolean) => Operator<A, A>;
export const takeUntil: <A>(signal: Source<any>) => Operator<A, A>;
export const skip: <A>(limit: number) => Operator<A, A>;
export const skipWhile: <A>(predicate: (value: A) => boolean) => Operator<A, A>;
export const skipUntil: <A>(signal: Source<any>) => Operator<A, A>;

export const flatten: <A>(source: Source<Source<A>[]>) => (sink: Sink<A>) => void;

export const forEach: <A>(fn: (value: A) => void, source: Source<A>) => void;
export const subscribe: <A>(fn: (value: A) => void, source: Source<A>) => (() => void);
