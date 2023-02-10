import { Source, Subscription, TalkbackKind, SignalKind } from './types';
import { talkbackPlaceholder } from './helpers';

/** Creates a subscription to a given source and invokes a `subscriber` callback for each value.
 * @param subscriber - A callback function called for each issued value.
 * @returns A function accepting a {@link Source} and returning a {@link Subscription}.
 *
 * @remarks
 * `subscribe` accepts a `subscriber` callback and returns a function accepting a {@link Source}.
 * When a source is passed to the returned funtion, the subscription will start and `subscriber`
 * will be called for each new value the Source issues. This will also return a {@link Subscription}
 * object that can cancel the ongoing {@link Source} early.
 *
 * @example
 * ```ts
 * const subscription = pipe(
 *   fromValue('test'),
 *   subscribe(text => {
 *     console.log(text); // 'test'
 *   })
 * );
 * ```
 */
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

/** Creates a subscription to a given source and invokes a `subscriber` callback for each value.
 * @see {@link subscribe} which this helper aliases withotu returnin a {@link Subscription}.
 * @param subscriber - A callback function called for each issued value.
 * @returns A function accepting a {@link Source}.
 *
 * @remarks
 * `forEach` accepts a `subscriber` callback and returns a function accepting a {@link Source}.
 * When a source is passed to the returned funtion, the subscription will start and `subscriber`
 * will be called for each new value the Source issues. Unlike `subscribe` it will not return a
 * Subscription object and can't be cancelled early.
 *
 * @example
 * ```ts
 * pipe(
 *   fromValue('test'),
 *   forEach(text => {
 *     console.log(text); // 'test'
 *   })
 * ); // undefined
 * ```
 */
export function forEach<T>(subscriber: (value: T) => void) {
  return (source: Source<T>): void => {
    subscribe(subscriber)(source);
  };
}

/** Creates a subscription to a given source and invokes a `subscriber` callback for each value.
 * @see {@link subscribe} which this helper aliases without accepting parameters or returning a
 * {@link types#Subscription | Subscription}.
 *
 * @param source - A {@link Source}.
 *
 * @remarks
 * `publish` accepts a {@link Source} and subscribes to it, starting its values. The resulting
 * values cannot be observed and the subscription can't be cancelled, as this helper is purely
 * intended to start side-effects.
 *
 * @example
 * ```ts
 * pipe(
 *   lazy(() => {
 *     console.log('test'); // this is called
 *     return fromValue(123); // this is never used
 *   }),
 *   publish
 * ); // undefined
 * ```
 */
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

/** Subscribes to a given source and collects all synchronous values into an array.
 * @param source - A {@link Source}.
 * @returns An array of values collected from the {@link Source}.
 *
 * @remarks
 * `subscribe` accepts a `subscriber` callback and returns a function accepting a {@link Source}.
 * When a source is passed to the returned funtion, the subscription will start and `subscriber`
 * will be called for each new value the Source issues. This will also return a {@link Subscription}
 * object that can cancel the ongoing {@link Source} early.
 *
 * @example
 * ```ts
 * const subscription = pipe(
 *   fromValue('test'),
 *   subscribe(text => {
 *     console.log(text); // 'test'
 *   })
 * );
 * ```
 */
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
