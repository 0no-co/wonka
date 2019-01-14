import { List, Sink, Source, Operator, Observer, Subject } from './wonka_types';

export const makeSubject: <A>() => Subject<A>;

export const make: <A>(f: (observer: Observer<A>) => (() => void)) => Source<A>;
export const fromList: <A>(list: List<A>) => Source<A>;
export const fromArray: <A>(array: A[]) => Source<A>;
export const fromValue: <A>(value: A) => Source<A>;
export const empty: Source<{}>;
export const never: Source<{}>;

export const tap: <A>(f: (value: A) => void) => Operator<A, A>;
export const map: <A, B>(f: (value: A) => B) => Operator<A, B>;
export const filter: <A>(f: (value: A) => boolean) => Operator<A, A>;
export const scan: <A, B>(f: (acc: B, value: A) => B, acc: B) => Operator<A, B>;

export const mergeMap: <A, B>(f: (value: A) => Source<B>) => Operator<A, B>;
export const switchMap: <A, B>(f: (value: A) => Source<B>) => Operator<A, B>;
export const concatMap: <A, B>(f: (value: A) => Source<B>) => Operator<A, B>;

export const merge: <A>(sources: Array<Source<A>>) => Source<A>;
export const concat: <A>(sources: Array<Source<A>>) => Source<A>;
export const share: <A>(source: Source<A>) => Source<A>;
export const combine: <A, B>(a: Source<A>, b: Source<B>) => Source<[A, B]>;

export const concatAll: <A>(source: Source<Source<A>>) => Source<A>;
export const mergeAll: <A>(source: Source<Source<A>>) => Source<A>;
export const flatten: <A>(source: Source<Source<A>>) => Source<A>;

export const take: <A>(max: number) => Operator<A, A>;
export const takeLast: <A>(max: number) => Operator<A, A>;
export const takeWhile: <A>(f: (x: A) => boolean) => Operator<A, A>;
export const takeUntil: <A>(signal: Source<any>) => Operator<A, A>;
export const skip: <A>(max: number) => Operator<A, A>;
export const skipWhile: <A>(f: (value: A) => boolean) => Operator<A, A>;
export const skipUntil: <A>(signal: Source<any>) => Operator<A, A>;

export const forEach: <A>(f: (x: A) => void) => (source: Source<A>) => void;
export const subscribe: <A>(f: (x: A) => void) => (source: Source<A>) => (() => void);
