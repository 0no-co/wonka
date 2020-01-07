import * as deriving from './helpers/wonka_deriving';
import * as sources from './wonka_sources.gen';
import * as sinks from './wonka_sinks.gen';
import * as operators from './wonka_operators.gen';
import * as web from './web/wonkaJs.gen';
import * as types from './wonka_types.gen';

/* This tests a noop operator for passive Pull talkback signals.
  A Pull will be sent from the sink upwards and should pass through
  the operator until the source receives it, which then pushes a
  value down. */
const passesPassivePull = (
  operator: types.operatorT<any, any>,
  output: any = 0
) =>
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
    expect(values).toEqual([output]);
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

/* This tests a noop operator for Start signals from the source.
  When the operator's sink is started by the source it'll receive
  a Start event. As a response it should never send more than one
  Start signals to the sink. */
const passesSingleStart = (operator: types.operatorT<any, any>) =>
  it('sends a single Start event to the incoming sink (spec)', () => {
    let start = 0;

    const source: types.sourceT<any> = sink => {
      sink(deriving.start(() => {}));
    };

    const sink: types.sinkT<any> = signal => {
      if (deriving.isStart(signal)) start++;
    };

    // When starting the operator we expect a single start event on the sink
    operator(source)(sink);
    expect(start).toBe(1);
  });

// TODO: Write a test for ending operators to send Close upwards

beforeEach(() => {
  jest.useFakeTimers();
});

describe('buffer', () => {
  const noop = operators.buffer(
    operators.merge([
      sources.fromValue(null),
      sources.never
    ])
  );

  // TODO: passesPassivePull(noop, [0]);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
  passesSingleStart(noop);

  it('emits batches of input values when a notifier emits', () => {
    const { source: notifier$, next: notify } = sources.makeSubject();
    const { source: input$, next } = sources.makeSubject();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.buffer(notifier$)(input$));

    next(1);
    next(2);
    expect(fn).not.toHaveBeenCalled();

    notify(null);
    expect(fn).toHaveBeenCalledWith([1, 2]);
  });
});

describe('concatMap', () => {
  const noop = operators.concatMap(x => sources.fromValue(x));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
  passesSingleStart(noop);
});

describe('debounce', () => {
  const noop = web.debounce(() => 0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('waits for a specified amount of silence before emitting the last value', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(web.debounce(() => 100)(source));

    next(1);
    jest.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    next(2);
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('delay', () => {
  const noop = web.delay(0);
  passesPassivePull(noop);
  passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('delays outputs by a specified delay timeout value', () => {
    const { source, next } = sources.makeSubject();
    const fn = jest.fn();

    sinks.forEach(fn)(web.delay(100)(source));

    next(1);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith(1);
  });
});

describe('filter', () => {
  const noop = operators.filter(() => true);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('prevents emissions for which a predicate fails', () => {
    const { source, next } = sources.makeSubject();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.filter(x => !!x)(source));

    next(false);
    expect(fn).not.toHaveBeenCalled();

    next(true);
    expect(fn).toHaveBeenCalledWith(true);
  });
});

describe('map', () => {
  const noop = operators.map(x => x);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('maps over values given a transform function', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.map((x: number) => x + 1)(source));

    next(1);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('mergeMap', () => {
  const noop = operators.mergeMap(x => sources.fromValue(x));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
  passesSingleStart(noop);
});

describe('onEnd', () => {
  const noop = operators.onEnd(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('calls a callback when the source ends', () => {
    const { source, next, complete } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(() => {})(operators.onEnd(fn)(source));

    next(null);
    expect(fn).not.toHaveBeenCalled();

    complete();
    expect(fn).toHaveBeenCalled();
  });
});

describe('onPush', () => {
  const noop = operators.onPush(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('calls a callback when the source emits', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(() => {})(operators.onPush(fn)(source));

    next(1);
    expect(fn).toHaveBeenCalledWith(1);
    next(2);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('is the same as `tap`', () => {
    expect(operators.onPush).toBe(operators.tap);
  });
});

describe('onStart', () => {
  const noop = operators.onStart(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('is called when the source starts', () => {
    let sink: types.sinkT<any>;

    const fn = jest.fn();
    const source: types.sourceT<any> = _sink => { sink = _sink; };

    sinks.forEach(() => {})(operators.onStart(fn)(source));

    expect(fn).not.toHaveBeenCalled();

    sink(deriving.start(() => {}));
    expect(fn).toHaveBeenCalled();
  });
});

describe('sample', () => {
  const noop = operators.sample(sources.fromValue(null));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
  passesSingleStart(noop);

  it('emits the latest value when a notifier source emits', () => {
    const { source: notifier$, next: notify } = sources.makeSubject();
    const { source: input$, next } = sources.makeSubject();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.sample(notifier$)(input$));

    next(1);
    next(2);
    expect(fn).not.toHaveBeenCalled();

    notify(null);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('scan', () => {
  const noop = operators.scan((_acc, x) => x, null);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('folds values continuously with a reducer and initial value', () => {
    const { source: input$, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    const reducer = (acc: number, x: number) => acc + x;
    sinks.forEach(fn)(operators.scan(reducer, 0)(input$));

    next(1);
    expect(fn).toHaveBeenCalledWith(1);
    next(2);
    expect(fn).toHaveBeenCalledWith(3);
  });
});

describe('share', () => {
  const noop = operators.share;
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('shares output values between sinks', () => {
    let push = () => {};

    const source: types.sourceT<any> = operators.share(sink => {
      sink(deriving.start(() => {}));
      push = () => {
        sink(deriving.push([0]));
        sink(deriving.end());
      };
    });

    const fnA = jest.fn();
    const fnB = jest.fn();

    sinks.forEach(fnA)(source);
    sinks.forEach(fnB)(source);
    push();

    expect(fnA).toHaveBeenCalledWith([0]);
    expect(fnB).toHaveBeenCalledWith([0]);
    expect(fnA.mock.calls[0][0]).toBe(fnB.mock.calls[0][0]);
  });
});

describe('skip', () => {
  const noop = operators.skip(0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('skips a number of values before emitting normally', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.skip(1)(source));

    next(1);
    expect(fn).not.toHaveBeenCalled();
    next(2);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('skipUntil', () => {
  const noop = operators.skipUntil(sources.fromValue(null));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('skips values until one passes a predicate', () => {
    const { source: notifier$, next: notify } = sources.makeSubject();
    const { source: input$, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.skipUntil(notifier$)(input$));

    next(1);
    expect(fn).not.toHaveBeenCalled();
    notify(null);
    next(2);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('skipWhile', () => {
  const noop = operators.skipWhile(() => false);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('skips values until one fails a predicate', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.skipWhile(x => x <= 1)(source));

    next(1);
    expect(fn).not.toHaveBeenCalled();
    next(2);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('switchMap', () => {
  const noop = operators.switchMap(x => sources.fromValue(x));
  // TODO: passesPassivePull(noop);
  // TODO: passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  // TODO: passesSourceEnd(noop);
  passesSingleStart(noop);
});

describe('take', () => {
  const noop = operators.take(10);
  passesPassivePull(noop);
  passesActivePush(noop);
  // TODO: passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('emits values until a maximum is reached', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.take(1)(source)(fn);
    next(1);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls).toEqual([
      [deriving.start(expect.any(Function))],
      [deriving.push(1)],
      [deriving.end()],
    ]);
  });
});

describe('takeUntil', () => {
  const noop = operators.takeUntil(sources.never);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('emits values until a maximum is reached', () => {
    const { source: notifier$, next: notify } = sources.makeSubject<number>();
    const { source: input$, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.takeUntil(notifier$)(input$)(fn);
    next(1);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls).toEqual([
      [deriving.start(expect.any(Function))],
      [deriving.push(1)],
    ]);

    notify(null);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls[2][0]).toEqual(deriving.end());
  });
});

describe('takeWhile', () => {
  const noop = operators.takeWhile(() => true);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  // TODO: passesSingleStart(noop);

  it('emits values while a predicate passes for all values', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.takeWhile(x => x < 2)(source)(fn);
    next(1);
    next(2);

    expect(fn).toHaveBeenCalledTimes(4);
    expect(fn.mock.calls).toEqual([
      [deriving.start(expect.any(Function))],
      [deriving.start(expect.any(Function))], // TODO: Shouldn't start twice!
      [deriving.push(1)],
      [deriving.end()],
    ]);
  });
});

describe('throttle', () => {
  const noop = web.throttle(() => 0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);

  it('should ignore emissions for a period of time after a value', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(web.throttle(() => 100)(source));

    next(1);
    expect(fn).toHaveBeenCalledWith(1);
    jest.advanceTimersByTime(50);

    next(2);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(50);

    next(3);
    expect(fn).toHaveBeenCalledWith(3);
  });
});
