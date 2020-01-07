import * as deriving from './helpers/wonka_deriving';
import * as sources from './wonka_sources.gen';
import * as types from './wonka_types.gen';
import * as web from './web/wonkaJs.gen';

const collectSignals = (source: types.sourceT<any>) => {
  let talkback = null;
  const signals = [];

  source(signal => {
    signals.push(signal);
    if (deriving.isStart(signal)) {
      talkback = deriving.unboxStart(signal);
      talkback(deriving.pull);
    } else if (deriving.isPush(signal)) {
      talkback(deriving.pull);
    }
  })

  return signals;
};

// TODO: Test that nothing is sent by cold sources when no pull signal comes in
// TODO: Test asynchronous pull signals as well
// TODO: Test close talkback signal

const passesTrampoline = (source: types.sourceT<any>) =>
  it('uses trampoline scheduling instead of recursive push signals', () => {
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

describe('fromArray', () => {
  passesTrampoline(sources.fromArray([1, 2]));
});

describe('fromList', () => {
  passesTrampoline(sources.fromList([1, [2]] as any));
});

describe('fromValue', () => {
  it('sends a single value and ends', () => {
    expect(collectSignals(sources.fromValue(1))).toEqual([
      deriving.start(expect.any(Function)),
      deriving.push(1),
      deriving.end()
    ]);
  });
});

describe('make', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

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
