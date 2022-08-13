import { Source, SignalKind, TalkbackKind } from './types';
import { push, start } from './helpers';

interface Callbag<I, O> {
  (t: 0, d: Callbag<O, I>): void;
  (t: 1, d: I): void;
  (t: 2, d?: any): void;
}

export function fromCallbag<T>(callbag: Callbag<any, T>): Source<T> {
  return sink => {
    callbag(0, (signal: number, data: any) => {
      if (signal === 0) {
        sink(
          start(signal => {
            if (signal === TalkbackKind.Pull) {
              data(1);
            } else {
              data(2);
            }
          })
        );
      } else if (signal === 1) {
        sink(push(data));
      } else if (signal === 2) {
        sink(SignalKind.End);
      }
    });
  };
}

export function toCallbag<T>(source: Source<T>): Callbag<any, T> {
  return (signal: number, sink: any) => {
    if (signal === 0) {
      source(signal => {
        if (signal === SignalKind.End) {
          sink(2);
        } else if (signal.tag === SignalKind.Start) {
          sink(0, (num: number) => {
            if (num === 1) {
              signal[0](TalkbackKind.Pull);
            } else if (num === 2) {
              signal[0](TalkbackKind.Close);
            }
          });
        } else {
          sink(1, signal[0]);
        }
      });
    }
  };
}
