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

export type Sink<A> = (signal: Signal<A>) => void;
export type Source<A> = (sink: Sink<A>) => void;
export type Operator<A, B> = (source: Source<A>) => Source<B>;
