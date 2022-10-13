import { onEnd } from './operators';
import { pipe } from './pipe';
import { subscribe } from './sinks';
import { make } from './sources';
import { Source } from './types';

export const toAsyncIterable = <T>(source: Source<T>): AsyncIterable<T> => {
  const waits: Array<(v: IteratorResult<T, unknown>) => void> = [];
  const buffer: Array<T> = [];

  let ended = false;

  const { unsubscribe } = pipe(
    source,
    onEnd(() => {
      ended = true;
      while (waits.length > 0) {
        waits.shift()?.({ value: undefined, done: true });
      }
    }),
    subscribe(value => {
      if (ended) {
        return;
      }

      if (waits.length > 0) {
        waits.shift()?.({ value });
      } else {
        buffer.push(value);
      }
    })
  );

  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        next(): Promise<IteratorResult<T, unknown>> {
          if (buffer.length === 0 && ended) {
            return Promise.resolve({ value: undefined, done: true });
          }

          if (buffer.length > 0) {
            return Promise.resolve({ value: buffer.shift() as T });
          }

          return new Promise<IteratorResult<T, unknown>>(resolve => {
            waits.push(resolve);
          });
        },
        return(value): Promise<IteratorResult<T, unknown>> {
          ended = true;
          buffer.length = 0;
          unsubscribe();
          return Promise.resolve({ value, done: true });
        },
        throw(): Promise<IteratorResult<T, unknown>> {
          ended = true;
          buffer.length = 0;
          unsubscribe();
          return Promise.resolve({ value: undefined, done: true });
        },
      };
    },
  };
};

export const fromAsyncIterable = <T>(asyncIterable: AsyncIterable<T>): Source<T> => {
  return make(observer => {
    let completed = false;

    const worker = async (): Promise<void> => {
      for await (const value of asyncIterable) {
        if (completed) {
          break;
        }

        observer.next(value);
      }
      observer.complete();
    };

    worker().catch(console.error);

    return (): void => {
      completed = true;
    };
  });
};
