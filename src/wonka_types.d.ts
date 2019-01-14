// Reason Helper Types:

interface ListNode<T> {
  [0]: T,
  [1]: 0 | List<T>
}

export type List<T> = ListNode<T> | 0;

// Wonka Types:

export type Talkback = 0 | 1;

export type Signal<A> =
  | { tag: 0, [0]: (talkback: Talkback) => void }
  | { tag: 1, [0]: A }
  | 0;

export interface Sink<A> { (signal: Signal<A>): void; }
export interface Source<A> { (sink: Sink<A>): void; }
export interface Operator<A, B> { (source: Source<A>): Source<B>; }

export interface Observer<A> {
  [0]: (value: A) => void,
  [1]: () => void
}

export interface Subject<A> {
  [0]: Source<A>,
  [1]: (value: A) => void,
  [2]: () => void
}
