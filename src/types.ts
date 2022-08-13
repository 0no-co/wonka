export const enum TalkbackKind {
  Pull = 0,
  Close = 1,
}

export type TalkbackFn = (signal: TalkbackKind) => void;
export type TeardownFn = () => void;

export const enum SignalKind {
  Start = 0,
  Push = 1,
  End = 0,
}

export interface Tag<T> {
  tag: T
}

export type Start<_T> = (Tag<SignalKind.Start> & [TalkbackFn])
export type Push<T> = (Tag<SignalKind.Push> & [T])
export type Signal<T> = Start<T> | Push<T> | SignalKind.End;

export type Sink<T> = (signal: Signal<T>) => void;
export type Source<T> = (sink: Sink<T>) => void;
export type Operator<In, Out> = (a: Source<In>) => Source<Out>;

export interface Subscription {
  unsubscribe(): void;
}

export interface Observer<T> {
  next(value: T): void;
  complete(): void;
}

export interface Subject<T> extends Observer<T> {
  source: Source<T>;
}
