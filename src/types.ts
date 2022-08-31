/** A talkback signal is used to tell a [Source] that either the [Sink] is ready for new values or that the stream should be cancelled */
export const enum TalkbackKind {
  Pull = 0,
  Close = 1,
}

/** A talkback callback is sent to the sink with the [Start] signal to communicate signals back to the source. */
export type TalkbackFn = (signal: TalkbackKind) => void;
export type TeardownFn = () => void;

export const enum SignalKind {
  Start = 0,
  Push = 1,
  End = 0,
}

export interface Tag<T> {
  tag: T;
}

/** The start [Signal] is the first signal and carries a callback (talkback) so the sink can send signals to the source */
export type Start<_T> = Tag<SignalKind.Start> & [TalkbackFn];
/** The Push [Signal] carries new values to the sink, like in an event emitter */
export type Push<T> = Tag<SignalKind.Push> & [T];

/** A signal that communicates new events to a sink. */
export type Signal<T> = Start<T> | Push<T> | SignalKind.End;

/** A sink accepts new values from a [Source], like [Push], [Start], and an end signal. The [Start] is used to receive a callback to send talkback signals back to the source. */
export type Sink<T> = (signal: Signal<T>) => void;
/** A source is a function that accepts a [Sink] and then starts sending [Signal]s to it. */
export type Source<T> = (sink: Sink<T>) => void;
/** An operator transforms a [Source] and returns a new [Source], potentially with different timings or output types. */
export type Operator<In, Out> = (a: Source<In>) => Source<Out>;

/** Extracts the type of a given Source */
export type TypeOfSource<T> = T extends Source<infer U> ? U : never;

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
