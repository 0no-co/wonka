import { Source, Subscription, TalkbackKind, SignalKind } from './types'
import { talkbackPlaceholder } from './helpers'

export function subscribe<T>(subscriber: (value: T) => void) {
  return (source: Source<T>): Subscription => {
    let talkback = talkbackPlaceholder;
    let ended = false;
    source((signal) => {
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
    }
  }
}

export function forEach<T>(subscriber: (value: T) => void) {
  return (source: Source<T>): void => {
    subscribe(subscriber)(source);
  };
}

export function publish<T>() {
  return (source: Source<T>): void => {
    subscribe((_value) => {/*noop*/})(source);
  };
}

export function toArray<T>(source: Source<T>): T[] {
  const values: T[] = [];
  let talkback = talkbackPlaceholder;
  let ended = false;
  source((signal) => {
    if (signal === SignalKind.End) {
      ended = true;
    } else if (signal.tag === SignalKind.Start) {
      (talkback = signal[0])(TalkbackKind.Pull);
    } else if (!ended) {
      values.push(signal[0]);
      talkback(TalkbackKind.Pull);
    }
  });
  return values;
}
