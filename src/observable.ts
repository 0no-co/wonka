import { Source, SignalKind, TalkbackKind } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

interface ObservableSubscription {
  closed?: boolean;
  unsubscribe(): void;
}

interface ObservableObserver<T> {
  next(value: T): void;
  error?(error: any): void;
  complete?(): void;
}

interface ObservableLike<T> {
  subscribe(observer: ObservableObserver<T>): ObservableSubscription;
  [Symbol.observable]?(): Observable<T>;
}

interface Observable<T> {
  subscribe(observer: ObservableObserver<T>): ObservableSubscription;

  subscribe(
    onNext: (value: T) => any,
    onError?: (error: any) => any,
    onComplete?: () => any
  ): ObservableSubscription;

  [Symbol.observable](): Observable<T>;
}

const observableSymbol = (): typeof Symbol.observable => Symbol.observable || '@@observable';

export function fromObservable<T>(input: ObservableLike<T>): Source<T> {
  input = input[observableSymbol()] ? (input as any)[observableSymbol()]() : input;
  return sink => {
    const subscription = input.subscribe({
      next(value: T) {
        sink(push(value));
      },
      complete() {
        sink(SignalKind.End);
      },
      error(error) {
        throw error;
      },
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) subscription.unsubscribe();
      })
    );
  };
}

export function toObservable<T>(source: Source<T>): Observable<T> {
  return {
    subscribe(
      next: ObservableObserver<T> | ((value: T) => any),
      error?: (error: any) => any | undefined,
      complete?: () => any | undefined
    ) {
      const observer: ObservableObserver<T> =
        typeof next == 'object' ? next : { next, error, complete };
      let talkback = talkbackPlaceholder;
      let ended = false;
      source(signal => {
        if (ended) {
          /*noop*/
        } else if (signal === SignalKind.End) {
          ended = true;
          if (observer.complete) observer.complete();
        } else if (signal.tag === SignalKind.Start) {
          (talkback = signal[0])(TalkbackKind.Pull);
        } else {
          observer.next(signal[0]);
          talkback(TalkbackKind.Pull);
        }
      });
      const subscription = {
        closed: false,
        unsubscribe() {
          subscription.closed = true;
          ended = true;
          talkback(TalkbackKind.Close);
        },
      };
      return subscription;
    },
    [observableSymbol()]() {
      return this;
    },
  };
}
