import { describe, it, expect } from 'vitest';

import { fromAsyncIterable, toAsyncIterable } from '../asyncIterable';
import { delay } from '../operators';
import { pipe } from '../pipe';
import { toPromise } from '../sinks';
import { fromArray } from '../sources';

describe('toAsyncIterable', () => {
  it('ahead', async () => {
    const iterable = pipe(fromArray([1, 2, 3]), toAsyncIterable);
    const iterator = iterable[Symbol.asyncIterator]();

    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await Promise.all([
      iterator.next(),
      iterator.next(),
      iterator.next(),
      iterator.next(),
    ]);

    expect(result).toEqual([
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { done: true, value: undefined },
    ]);
  });

  it('behind', async () => {
    const iterable = pipe(fromArray([1, 2, 3]), delay(10), toAsyncIterable);
    const iterator = iterable[Symbol.asyncIterator]();

    const result = await Promise.all([
      iterator.next(),
      iterator.next(),
      iterator.next(),
      iterator.next(),
    ]);

    expect(result).toEqual([
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { done: true, value: undefined },
    ]);
  });

  it('ending with return', async () => {
    const iterable = pipe(fromArray([1, 2, 3, 4, 5]), toAsyncIterable);
    const iterator = iterable[Symbol.asyncIterator]();

    const result = await Promise.all([iterator.next(), iterator.return?.(), iterator.next()]);

    expect(result).toEqual([
      { value: 1 },
      { done: true, value: undefined },
      { done: true, value: undefined },
    ]);
  });

  it('ending with throw', async () => {
    const iterable = pipe(fromArray([1, 2, 3, 4, 5]), toAsyncIterable);
    const iterator = iterable[Symbol.asyncIterator]();

    const result = await Promise.all([
      iterator.next(),
      iterator.throw?.(new Error('!')),
      iterator.next(),
    ]);

    expect(result).toEqual([
      { value: 1 },
      { done: true, value: undefined },
      { done: true, value: undefined },
    ]);
  });
});

describe('fromAsyncIterable', () => {
  it('simple', async () => {
    async function* gen(): AsyncGenerator<number> {
      yield Promise.resolve(1);
      yield Promise.resolve(2);
      await new Promise(resolve => setTimeout(resolve, 10));
      yield Promise.resolve(3);
    }

    const result = await pipe(fromAsyncIterable(gen()), toPromise);
    expect(result).toEqual(3);
  });
});
