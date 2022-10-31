import { Source, SignalKind, TalkbackKind } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

interface ObservableSubscription {
  closed?: boolean;
  unsubscribe(): void;
}

interface ObservableObserver<T> {
  next(value: T): void;
  error(error: any): void;
  complete(): void;
}

interface Observable<T> {
  subscribe(observer: ObservableObserver<T>): ObservableSubscription;
}

const observableSymbol = (): symbol | string => Symbol.observable || '@@observable';

export function fromObservable<T>(input: Observable<T>): Source<T> {
  input = input[observableSymbol()] ? (input as any)[observableSymbol()]() : input;
  return sink => {
    const subscription = input.subscribe({
      next(value: T) {
        sink(push(value));
      },
      complete() {
        sink(SignalKind.End);
      },
      error() {
        /*noop*/
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
    subscribe(observer: ObservableObserver<T>) {
      let talkback = talkbackPlaceholder;
      let ended = false;
      source(signal => {
        if (ended) {
          /*noop*/
        } else if (signal === SignalKind.End) {
          ended = true;
          observer.complete();
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
