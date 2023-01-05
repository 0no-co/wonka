import { Source, Subscription, TalkbackKind, SignalKind } from './types';
import { talkbackPlaceholder } from './helpers';

export function subscribe<T>(subscriber: (value: T) => void) {
  return (source: Source<T>): Subscription => {
    let talkback = talkbackPlaceholder;
    let ended = false;
    source(signal => {
      if (signal === SignalKind.End) {
        ended = true;
      } else if (signal.tag === SignalKind.Start) {
        (talkback = signal[0])(TalkbackKind.Pull);
      } else if (!ended) {
        subscriber(signal[0]);
        talkback(TalkbackKind.Pull);
      }
    });
    return {
      unsubscribe() {
        if (!ended) {
          ended = true;
          talkback(TalkbackKind.Close);
        }
      },
    };
  };
}

export function forEach<T>(subscriber: (value: T) => void) {
  return (source: Source<T>): void => {
    subscribe(subscriber)(source);
  };
}

export function publish<T>(source: Source<T>): void {
  subscribe(_value => {
    /*noop*/
  })(source);
}

const doneResult = { done: true } as IteratorReturnResult<void>;

export const toAsyncIterable = <T>(source: Source<T>): AsyncIterable<T> => ({
  [Symbol.asyncIterator](): AsyncIterator<T> {
    const buffer: T[] = [];

    let ended = false;
    let talkback = talkbackPlaceholder;
    let next: ((value: IteratorResult<T>) => void) | void;

    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        if (next) next = next(doneResult);
        ended = true;
      } else if (signal.tag === SignalKind.Start) {
        (talkback = signal[0])(TalkbackKind.Pull);
      } else if (next) {
        next = next({ value: signal[0], done: false });
      } else {
        buffer.push(signal[0]);
      }
    });

    return {
      async next(): Promise<IteratorResult<T>> {
        if (ended && !buffer.length) {
          return doneResult;
        } else if (!ended && buffer.length <= 1) {
          talkback(TalkbackKind.Pull);
        }

        return buffer.length
          ? { value: buffer.shift()!, done: false }
          : new Promise(resolve => (next = resolve));
      },
      async return(): Promise<IteratorReturnResult<void>> {
        if (!ended) next = talkback(TalkbackKind.Close);
        ended = true;
        return doneResult;
      },
    };
  },
});

export function toArray<T>(source: Source<T>): T[] {
  const values: T[] = [];
  let talkback = talkbackPlaceholder;
  let ended = false;
  source(signal => {
    if (signal === SignalKind.End) {
      ended = true;
    } else if (signal.tag === SignalKind.Start) {
      (talkback = signal[0])(TalkbackKind.Pull);
    } else {
      values.push(signal[0]);
      talkback(TalkbackKind.Pull);
    }
  });
  if (!ended) talkback(TalkbackKind.Close);
  return values;
}

export function toPromise<T>(source: Source<T>): Promise<T> {
  return new Promise(resolve => {
    let talkback = talkbackPlaceholder;
    let value: T | void;
    source(signal => {
      if (signal === SignalKind.End) {
        Promise.resolve(value!).then(resolve);
      } else if (signal.tag === SignalKind.Start) {
        (talkback = signal[0])(TalkbackKind.Pull);
      } else {
        value = signal[0];
        talkback(TalkbackKind.Pull);
      }
    });
  });
}
