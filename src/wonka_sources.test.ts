import * as deriving from './helpers/wonka_deriving';
import * as sources from './wonka_sources.gen';
import * as types from './wonka_types.gen';
import * as web from './web/wonkaJs.gen';

import Observable from 'zen-observable';

const collectSignals = (
  source: types.sourceT<any>,
  onStart?: (talkbackCb: (tb: types.talkbackT) => void) => void
) => {
  let talkback = null;
  const signals = [];

  source(signal => {
    signals.push(signal);
    if (deriving.isStart(signal)) {
      talkback = deriving.unboxStart(signal);
      if (onStart) onStart(talkback);
      talkback(deriving.pull);
    } else if (deriving.isPush(signal)) {
      talkback(deriving.pull);
    }
  })

  return signals;
};

// TODO: Test close talkback signal

/* All synchronous, cold sources won't send anything unless a Pull signal
  has been received. */
const passesColdPull = (source: types.sourceT<any>) =>
  it('sends nothing when no Pull talkback signal has been sent (spec)', () => {
    let pushes = 0;
    let talkback = null;

    const sink: types.sinkT<any> = signal => {
      if (deriving.isPush(signal)) {
        pushes++;
      } else if (deriving.isStart(signal)) {
        talkback = deriving.unboxStart(signal);
      }
    };

    source(sink);
    expect(talkback).not.toBe(null);
    expect(pushes).toBe(0);

    setTimeout(() => {
      expect(pushes).toBe(0);
      talkback(deriving.pull);
    }, 10);

    jest.runAllTimers();
    expect(pushes).toBe(1);
  });

/* All synchronous, cold sources need to use trampoline scheduling to avoid
  recursively sending more and more Push signals which would eventually lead
  to a call stack overflow when too many values are emitted. */
const passesTrampoline = (source: types.sourceT<any>) =>
  it('uses trampoline scheduling instead of recursive push signals (spec)', () => {
    let talkback = null;
    let pushes = 0;

    const signals = [];
    const sink: types.sinkT<any> = signal => {
      if (deriving.isPush(signal)) {
        const lastPushes = ++pushes;
        signals.push(signal);
        talkback(deriving.pull);
        expect(lastPushes).toBe(pushes);
      } else if (deriving.isStart(signal)) {
        talkback = deriving.unboxStart(signal);
        talkback(deriving.pull);
        expect(pushes).toBe(2);
      } else if (deriving.isEnd(signal)) {
        signals.push(signal);
        expect(pushes).toBe(2);
      }
    };

    source(sink);

    expect(signals).toEqual([
      deriving.push(1),
      deriving.push(2),
      deriving.end(),
    ]);
  });

beforeEach(() => {
  jest.useFakeTimers();
});

describe('fromArray', () => {
  passesTrampoline(sources.fromArray([1, 2]));
  passesColdPull(sources.fromArray([0]));
});

describe('fromList', () => {
  passesTrampoline(sources.fromList([1, [2]] as any));
  passesColdPull(sources.fromList([0] as any));
});

describe('fromValue', () => {
  passesColdPull(sources.fromValue(0));

  it('sends a single value and ends', () => {
    expect(collectSignals(sources.fromValue(1))).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
      deriving.end()
    ]);
  });
});

describe('make', () => {
  it('may be used to create async sources', () => {
    const teardown = jest.fn();
    const source = sources.make(observer => {
      setTimeout(() => observer.next(1), 10);
      setTimeout(() => observer.complete(), 20);
      return teardown;
    });

    const signals = collectSignals(source);
    expect(signals).toEqual([deriving.start(expect.any(Function))]);
    jest.runAllTimers();

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
      deriving.end(),
    ]);

    // `teardown` is currently only called for Close signals but not on completion
    // TODO: expect(teardown).toHaveBeenCalled();
  });
});

describe('makeSubject', () => {
  it('may be used to emit signals programmatically', () => {
    const { source, next, complete } = sources.makeSubject();
    const signals = collectSignals(source);

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
    ]);

    next(1);

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
    ]);

    complete();

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
      deriving.end(),
    ]);
  });
});

describe('never', () => {
  it('emits nothing and ends immediately', () => {
    const signals = collectSignals(sources.never);
    expect(signals).toEqual([deriving.start(expect.any(Function)) ]);
  });
});

describe('empty', () => {
  it('emits nothing and ends immediately', () => {
    const signals = collectSignals(sources.empty);

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
      deriving.end(),
    ]);
  });
});

describe('fromPromise', () => {
  it('emits a value when the promise resolves', async () => {
    const promise = Promise.resolve(1);
    const signals = collectSignals(web.fromPromise(promise));

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
    ]);

    await promise;

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
      deriving.end(),
    ]);
  });
});

describe('fromObservable', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('converts an Observable to a Wonka source', async () => {
    const source = web.fromObservable(Observable.from([1, 2]));
    const signals = collectSignals(source);

    await new Promise(resolve => setTimeout(resolve));

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
      deriving.push(2),
      deriving.end(),
    ]);
  });

  it('supports cancellation on converted Observables', async () => {
    const source = web.fromObservable(Observable.from([1, 2]));
    const signals = collectSignals(source, talkback => {
      talkback(deriving.close);
    });

    await new Promise(resolve => setTimeout(resolve));

    expect(signals).toEqual([
      deriving.start(expect.any(Function)),
    ]);
  });
});
