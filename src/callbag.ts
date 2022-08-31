import { Source, SignalKind } from './types';
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
            data(signal + 1);
          })
        );
      } else if (signal === 1) {
        sink(push(data));
      } else {
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
            if (num < 3) signal[0](num - 1);
          });
        } else {
          sink(1, signal[0]);
        }
      });
    }
  };
}
