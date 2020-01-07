import * as deriving from './helpers/wonka_deriving';
import * as sources from './wonka_sources.gen';
import * as types from './wonka_types.gen';

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
