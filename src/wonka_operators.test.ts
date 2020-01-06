import * as deriving from './helpers/wonka_deriving';
import * as sources from './wonka_sources.gen';
import * as operators from './wonka_operators.gen';
import * as web from './web/wonkaJs.gen';
import * as types from './wonka_types.gen';

/* This tests a noop operator for passive Pull talkback signals.
  A Pull will be sent from the sink upwards and should pass through
  the operator until the source receives it, which then pushes a
  value down. */
const passesPassivePull = (operator: types.operatorT<any, any>) =>
  it('responds to Pull talkback signals (spec)', () => {
    let talkback = null;
    const values = [];

    const source: types.sourceT<any> = sink => {
      sink(deriving.start(tb => {
        if (tb === deriving.pull)
          sink(deriving.push(0));
      }));
    };

    const sink: types.sinkT<any> = signal => {
      expect(deriving.isEnd(signal)).toBeFalsy();
      if (deriving.isPush(signal)) {
        values.push(deriving.unboxPush(signal));
      } else if (deriving.isStart(signal)) {
        talkback = deriving.unboxStart(signal);
      }
    };

    operator(source)(sink);
    // The Start signal should always come in immediately
    expect(talkback).not.toBe(null);
    // No Push signals should be issued initially
    expect(values).toEqual([]);

    // When pulling a value we expect an immediate response
    talkback(deriving.pull);
    jest.runAllTimers();
    expect(values).toEqual([0]);
  });

/* This tests a noop operator for regular, active Push signals.
  A Push will be sent downwards from the source, through the
  operator to the sink. Pull events should be let through from
  the sink after every Push event. */
const passesActivePush = (operator: types.operatorT<any, any>) =>
  it('responds to eager Push signals (spec)', () => {
    const values = [];
    let talkback = null;
    let push = null;
    let pulls = 0;

    const source: types.sourceT<any> = sink => {
      push = (value: any) => sink(deriving.push(value));
      sink(deriving.start(tb => {
        if (tb === deriving.pull)
          pulls++;
      }));
    };

    const sink: types.sinkT<any> = signal => {
      expect(deriving.isEnd(signal)).toBeFalsy();
      if (deriving.isStart(signal)) {
        talkback = deriving.unboxStart(signal);
      } else if (deriving.isPush(signal)) {
        values.push(deriving.unboxPush(signal));
        talkback(deriving.pull);
      }
    };

    operator(source)(sink);
    // No Pull signals should be issued initially
    expect(pulls).toBe(0);

    // When pushing a value we expect an immediate response
    push(0);
    jest.runAllTimers();
    expect(values).toEqual([0]);
    // Subsequently the Pull signal should have travelled upwards
    expect(pulls).toBe(1);
  });

/* This tests a noop operator for Close talkback signals from the sink.
  A Close signal will be sent, which should be forwarded to the source,
  which then ends the communication without sending an End signal. */
const passesSinkClose = (operator: types.operatorT<any, any>) =>
  it('responds to Close signals from sink (spec)', () => {
    let talkback = null;
    let ended = false;
    let pulls = 0;

    const source: types.sourceT<any> = sink => {
      sink(deriving.start(tb => {
        if (tb === deriving.pull) {
          pulls++;
          if (!ended) sink(deriving.push(0));
        } if (tb === deriving.close) {
          ended = true;
        }
      }));
    };

    const sink: types.sinkT<any> = signal => {
      expect(deriving.isEnd(signal)).toBeFalsy();
      if (deriving.isStart(signal)) {
        talkback = deriving.unboxStart(signal);
      } else if (deriving.isPush(signal)) {
        talkback(deriving.close);
      }
    };

    operator(source)(sink);

    // When pushing a value we expect an immediate close signal
    talkback(deriving.pull);
    jest.runAllTimers();
    expect(ended).toBeTruthy();
    expect(pulls).toBe(1);
  });

/* This tests a noop operator for End signals from the source.
  A Push and End signal will be sent after the first Pull talkback
  signal from the sink, which shouldn't lead to any extra Close or Pull
  talkback signals. */
const passesSourceEnd = (operator: types.operatorT<any, any>) =>
  it('passes on End signals from source (spec)', () => {
    const signals = [];
    let talkback = null;
    let pulls = 0;

    const source: types.sourceT<any> = sink => {
      sink(deriving.start(tb => {
        expect(tb).not.toBe(deriving.close);
        if (tb === deriving.pull) pulls++;
        if (pulls === 1) {
          sink(deriving.push(0));
          sink(deriving.end());
        }
      }));
    };

    const sink: types.sinkT<any> = signal => {
      if (deriving.isStart(signal)) {
        talkback = deriving.unboxStart(signal);
      } else {
        signals.push(signal);
      }
    };

    operator(source)(sink);

    // When pushing a value we expect an immediate Push then End signal
    talkback(deriving.pull);
    jest.runAllTimers();
    expect(pulls).toBe(1);
    expect(signals).toEqual([deriving.push(0), deriving.end()]);
  });

describe('concatMap', () => {
  // const noop = operators.concatMap(x => sources.fromValue(x));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
});

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());

  const noop = web.debounce(() => 0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('delay', () => {
  beforeEach(() => jest.useFakeTimers());

  const noop = web.delay(0);
  passesPassivePull(noop);
  passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('filter', () => {
  const noop = operators.filter(() => true);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('map', () => {
  const noop = operators.map(x => x);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('mergeMap', () => {
  // const noop = operators.mergeMap(x => sources.fromValue(x));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
});

describe('onEnd', () => {
  const noop = operators.onEnd(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('onPush', () => {
  const noop = operators.onPush(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('onStart', () => {
  const noop = operators.onStart(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('sample', () => {
  // const noop = operators.sample(sources.fromValue(null));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
});

describe('scan', () => {
  const noop = operators.scan((_acc, x) => x, null);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('share', () => {
  const noop = operators.share;
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('skip', () => {
  const noop = operators.skip(0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('skipUntil', () => {
  const noop = operators.skipUntil(sources.fromValue(null));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('skipWhile', () => {
  const noop = operators.skipWhile(() => false);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('switchMap', () => {
  // const noop = operators.switchMap(x => sources.fromValue(x));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
});

describe('take', () => {
  const noop = operators.take(10);
  passesPassivePull(noop);
  passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('takeUntil', () => {
  const noop = operators.takeUntil(sources.never);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('takeWhile', () => {
  const noop = operators.takeUntil(() => true);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());

  const noop = web.throttle(() => 0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
});


