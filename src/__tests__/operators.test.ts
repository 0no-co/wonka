import { Source, Sink, Operator, Signal, SignalKind, TalkbackKind, TalkbackFn } from '../types';
import { push, start } from '../helpers';

import * as sources from '../sources';
import * as sinks from '../sinks';
import * as operators from '../operators';

/* This tests a noop operator for passive Pull talkback signals.
  A Pull will be sent from the sink upwards and should pass through
  the operator until the source receives it, which then pushes a
  value down. */
const passesPassivePull = (operator: Operator<any, any>, output: any = 0) => {
  it('responds to Pull talkback signals (spec)', () => {
    let talkback: TalkbackFn | null = null;
    let pushes = 0;
    const values: any[] = [];

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (!pushes && signal === TalkbackKind.Pull) {
            pushes++;
            sink(push(0));
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      expect(signal).not.toBe(SignalKind.End);
      if (signal === SignalKind.End) {
        /*noop*/
      } else if (signal.tag === SignalKind.Push) {
        values.push(signal[0]);
      } else {
        talkback = signal[0];
      }
    };

    operator(source)(sink);
    // The Start signal should always come in immediately
    expect(talkback).not.toBe(null);
    // No Push signals should be issued initially
    expect(values).toEqual([]);

    // When pulling a value we expect an immediate response
    talkback!(TalkbackKind.Pull);
    jest.runAllTimers();
    expect(values).toEqual([output]);
  });
};

/* This tests a noop operator for regular, active Push signals.
  A Push will be sent downwards from the source, through the
  operator to the sink. Pull events should be let through from
  the sink after every Push event. */
const passesActivePush = (operator: Operator<any, any>, result: any = 0) => {
  it('responds to eager Push signals (spec)', () => {
    const values: any[] = [];
    let talkback: TalkbackFn | null = null;
    let sink: Sink<any> | null = null;
    let pulls = 0;

    const source: Source<any> = _sink => {
      (sink = _sink)(
        start(signal => {
          if (signal === TalkbackKind.Pull) pulls++;
        })
      );
    };

    operator(source)(signal => {
      expect(signal).not.toBe(SignalKind.End);
      if (signal === SignalKind.End) {
        /*noop*/
      } else if (signal.tag === SignalKind.Start) {
        talkback = signal[0];
      } else if (signal.tag === SignalKind.Push) {
        values.push(signal[0]);
        talkback!(TalkbackKind.Pull);
      }
    });

    // No Pull signals should be issued initially
    expect(pulls).toBe(0);

    // When pushing a value we expect an immediate response
    sink!(push(0));
    jest.runAllTimers();
    expect(values).toEqual([result]);
    // Subsequently the Pull signal should have travelled upwards
    expect(pulls).toBe(1);
  });
};

/* This tests a noop operator for Close talkback signals from the sink.
  A Close signal will be sent, which should be forwarded to the source,
  which then ends the communication without sending an End signal. */
const passesSinkClose = (operator: Operator<any, any>) => {
  it('responds to Close signals from sink (spec)', () => {
    let talkback: TalkbackFn | null = null;
    let closing = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull && !closing) {
            sink(push(0));
          } else if (signal === TalkbackKind.Close) {
            closing++;
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      expect(signal).not.toBe(SignalKind.End);
      if (signal === SignalKind.End) {
        /*noop*/
      } else if (signal.tag === SignalKind.Push) {
        talkback!(TalkbackKind.Close);
      } else {
        talkback = signal[0];
      }
    };

    operator(source)(sink);

    // When pushing a value we expect an immediate close signal
    talkback!(TalkbackKind.Pull);
    jest.runAllTimers();
    expect(closing).toBe(1);
  });
};

/* This tests a noop operator for End signals from the source.
  A Push and End signal will be sent after the first Pull talkback
  signal from the sink, which shouldn't lead to any extra Close or Pull
  talkback signals. */
const passesSourceEnd = (operator: Operator<any, any>, result: any = 0) => {
  it('passes on immediate Push then End signals from source (spec)', () => {
    const signals: Signal<any>[] = [];
    let talkback: TalkbackFn | null = null;
    let pulls = 0;
    let ending = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          expect(signal).not.toBe(TalkbackKind.Close);
          if (signal === TalkbackKind.Pull) {
            pulls++;
            if (pulls === 1) {
              sink(push(0));
              sink(SignalKind.End);
            }
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      if (signal === SignalKind.End) {
        signals.push(signal);
        ending++;
      } else if (signal.tag === SignalKind.Push) {
        signals.push(signal);
      } else {
        talkback = signal[0];
      }
    };

    operator(source)(sink);

    // When pushing a value we expect an immediate Push then End signal
    talkback!(TalkbackKind.Pull);
    jest.runAllTimers();
    expect(ending).toBe(1);
    expect(signals).toEqual([push(result), SignalKind.End]);
    // Also no additional pull event should be created by the operator
    expect(pulls).toBe(1);
  });
};

/* This tests a noop operator for End signals from the source
  after the first pull in response to another.
  This is similar to passesSourceEnd but more well behaved since
  mergeMap/switchMap/concatMap are eager operators. */
const passesSourcePushThenEnd = (operator: Operator<any, any>, result: any = 0) => {
  it('passes on End signals from source (spec)', () => {
    const signals: Signal<any>[] = [];
    let talkback: TalkbackFn | null = null;
    let pulls = 0;
    let ending = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          expect(signal).not.toBe(TalkbackKind.Close);
          if (signal === TalkbackKind.Pull) {
            pulls++;
            if (pulls <= 2) {
              sink(push(0));
            } else {
              sink(SignalKind.End);
            }
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      if (signal === SignalKind.End) {
        signals.push(signal);
        ending++;
      } else if (signal.tag === SignalKind.Push) {
        signals.push(signal);
        talkback!(TalkbackKind.Pull);
      } else {
        talkback = signal[0];
      }
    };

    operator(source)(sink);

    // When pushing a value we expect an immediate Push then End signal
    talkback!(TalkbackKind.Pull);
    jest.runAllTimers();
    expect(ending).toBe(1);
    expect(pulls).toBe(3);
    expect(signals).toEqual([push(result), push(result), SignalKind.End]);
  });
};

/* This tests a noop operator for Start signals from the source.
  When the operator's sink is started by the source it'll receive
  a Start event. As a response it should never send more than one
  Start signals to the sink. */
const passesSingleStart = (operator: Operator<any, any>) => {
  it('sends a single Start event to the incoming sink (spec)', () => {
    let starts = 0;

    const source: Source<any> = sink => {
      sink(start(() => {}));
    };

    const sink: Sink<any> = signal => {
      if (signal !== SignalKind.End && signal.tag === SignalKind.Start) {
        starts++;
      }
    };

    // When starting the operator we expect a single start event on the sink
    operator(source)(sink);
    expect(starts).toBe(1);
  });
};

/* This tests a noop operator for silence after End signals from the source.
  When the operator receives the End signal it shouldn't forward any other
  signals to the sink anymore.
  This isn't a strict requirement, but some operators should ensure that
  all sources are well behaved. This is particularly true for operators
  that either Close sources themselves or may operate on multiple sources. */
const passesStrictEnd = (operator: Operator<any, any>) => {
  it('stops all signals after End has been received (spec: strict end)', () => {
    let pulls = 0;
    const signals: Signal<any>[] = [];

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            pulls++;
            sink(SignalKind.End);
            sink(push(123));
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      if (signal === SignalKind.End) {
        signals.push(signal);
      } else if (signal.tag === SignalKind.Push) {
        signals.push(signal);
      } else {
        signal[0](TalkbackKind.Pull);
      }
    };

    operator(source)(sink);

    // The Push signal should've been dropped
    jest.runAllTimers();
    expect(signals).toEqual([SignalKind.End]);
    expect(pulls).toBe(1);
  });

  it('stops all signals after Close has been received (spec: strict close)', () => {
    const signals: Signal<any>[] = [];

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Close) {
            sink(push(123));
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      if (signal === SignalKind.End) {
        signals.push(signal);
      } else if (signal.tag === SignalKind.Push) {
        signals.push(signal);
      } else {
        signal[0](TalkbackKind.Close);
      }
    };

    operator(source)(sink);

    // The Push signal should've been dropped
    jest.runAllTimers();
    expect(signals).toEqual([]);
  });
};

/* This tests an immediately closing operator for End signals to
  the sink and Close signals to the source.
  When an operator closes immediately we expect to see a Close
  signal at the source and an End signal to the sink, since the
  closing operator is expected to end the entire chain. */
const passesCloseAndEnd = (closingOperator: Operator<any, any>) => {
  it('closes the source and ends the sink correctly (spec: ending operator)', () => {
    let closing = 0;
    let ending = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          // For some operator tests we do need to send a single value
          if (signal === TalkbackKind.Pull) {
            sink(push(null));
          } else {
            closing++;
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      if (signal === SignalKind.End) {
        ending++;
      } else if (signal.tag === SignalKind.Start) {
        signal[0](TalkbackKind.Pull);
      }
    };

    // We expect the operator to immediately end and close
    closingOperator(source)(sink);
    expect(closing).toBe(1);
    expect(ending).toBe(1);
  });
};

const passesAsyncSequence = (operator: Operator<any, any>, result: any = 0) => {
  it('passes an async push with an async end (spec)', () => {
    let hasPushed = false;
    const signals: Signal<any>[] = [];

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull && !hasPushed) {
            hasPushed = true;
            setTimeout(() => sink(push(0)), 10);
            setTimeout(() => sink(SignalKind.End), 20);
          }
        })
      );
    };

    const sink: Sink<any> = signal => {
      if (signal === SignalKind.End) {
        signals.push(signal);
      } else if (signal.tag === SignalKind.Push) {
        signals.push(signal);
      } else {
        setTimeout(() => {
          signal[0](TalkbackKind.Pull);
        }, 5);
      }
    };

    // We initially expect to see the push signal
    // Afterwards after all timers all other signals come in
    operator(source)(sink);
    expect(signals.length).toBe(0);
    jest.advanceTimersByTime(5);
    expect(hasPushed).toBeTruthy();
    jest.runAllTimers();

    expect(signals).toEqual([push(result), SignalKind.End]);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
});

describe('combine', () => {
  const noop = (source: Source<any>) => operators.combine(sources.fromValue(0), source);

  passesPassivePull(noop, [0, 0]);
  passesActivePush(noop, [0, 0]);
  passesSinkClose(noop);
  passesSourceEnd(noop, [0, 0]);
  passesSingleStart(noop);
  passesStrictEnd(noop);

  it('emits the zipped values of two sources', () => {
    const { source: sourceA, next: nextA } = sources.makeSubject();
    const { source: sourceB, next: nextB } = sources.makeSubject();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.combine(sourceA, sourceB));

    nextA(1);
    expect(fn).not.toHaveBeenCalled();
    nextB(2);
    expect(fn).toHaveBeenCalledWith([1, 2]);
  });
});

describe('buffer', () => {
  const valueThenNever: Source<any> = sink =>
    sink(
      start(signal => {
        if (signal === TalkbackKind.Pull) sink(push(null));
      })
    );

  const noop = operators.buffer(valueThenNever);

  passesPassivePull(noop, [0]);
  passesActivePush(noop, [0]);
  passesSinkClose(noop);
  passesSourcePushThenEnd(noop, [0]);
  passesSingleStart(noop);
  passesStrictEnd(noop);

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

    next(3);
    notify(null);
    expect(fn).toHaveBeenCalledWith([3]);
  });
});

describe('concatMap', () => {
  const noop = operators.concatMap(x => sources.fromValue(x));
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourcePushThenEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  // This synchronous test for concatMap will behave the same as mergeMap & switchMap
  it('emits values from each flattened synchronous source', () => {
    const { source, next, complete } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.concatMap((x: number) => sources.fromArray([x, x + 1]))(source)(fn);

    next(1);
    next(3);
    complete();

    expect(fn).toHaveBeenCalledTimes(6);
    expect(fn.mock.calls).toEqual([
      [start(expect.any(Function))],
      [push(1)],
      [push(2)],
      [push(3)],
      [push(4)],
      [SignalKind.End],
    ]);
  });

  // This synchronous test for concatMap will behave the same as mergeMap & switchMap
  it('lets inner sources finish when outer source ends', () => {
    const signals: Signal<any>[] = [];
    const teardown = jest.fn();
    const fn = (signal: Signal<any>) => {
      signals.push(signal);
      if (signal !== SignalKind.End && signal.tag === SignalKind.Start) {
        signal[0](TalkbackKind.Pull);
        signal[0](TalkbackKind.Close);
      }
    };

    operators.concatMap(() => {
      return sources.make(() => teardown);
    })(sources.fromValue(null))(fn);

    expect(teardown).toHaveBeenCalled();
    expect(signals).toEqual([start(expect.any(Function))]);
  });

  // This asynchronous test for concatMap will behave differently than mergeMap & switchMap
  it('emits values from each flattened asynchronous source, one at a time', () => {
    const source = operators.delay<number>(4)(sources.fromArray([1, 10]));
    const fn = jest.fn();

    sinks.forEach(fn)(
      operators.concatMap((x: number) => {
        return operators.delay(5)(sources.fromArray([x, x * 2]));
      })(source)
    );

    jest.advanceTimersByTime(14);
    expect(fn.mock.calls).toEqual([[1], [2]]);

    jest.runAllTimers();
    expect(fn.mock.calls).toEqual([[1], [2], [10], [20]]);
  });

  it('works for fully asynchronous sources', () => {
    const fn = jest.fn();

    sinks.forEach(fn)(
      operators.concatMap(() => {
        return sources.make(observer => {
          setTimeout(() => observer.next(1));
          return () => {};
        });
      })(sources.fromValue(null))
    );

    jest.runAllTimers();
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('emits synchronous values in order', () => {
    const values: any[] = [];

    sinks.forEach(x => values.push(x))(
      operators.concat([sources.fromArray([1, 2]), sources.fromArray([3, 4])])
    );

    expect(values).toEqual([1, 2, 3, 4]);
  });
});

describe('debounce', () => {
  const noop = operators.debounce(() => 0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  it('waits for a specified amount of silence before emitting the last value', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.debounce(() => 100)(source));

    next(1);
    jest.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    next(2);
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('emits debounced value with delayed End signal', () => {
    const { source, next, complete } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.debounce(() => 100)(source));

    next(1);
    complete();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalled();
  });
});

describe('delay', () => {
  const noop = operators.delay(0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);

  it('delays outputs by a specified delay timeout value', () => {
    const { source, next } = sources.makeSubject();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.delay(100)(source));

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
  passesAsyncSequence(noop);

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
  passesAsyncSequence(noop);

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
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourcePushThenEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  // This synchronous test for mergeMap will behave the same as concatMap & switchMap
  it('emits values from each flattened synchronous source', () => {
    const { source, next, complete } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.mergeMap((x: number) => sources.fromArray([x, x + 1]))(source)(fn);

    next(1);
    next(3);
    complete();

    expect(fn.mock.calls).toEqual([
      [start(expect.any(Function))],
      [push(1)],
      [push(2)],
      [push(3)],
      [push(4)],
      [SignalKind.End],
    ]);
  });

  // This synchronous test for mergeMap will behave the same as concatMap & switchMap
  it('lets inner sources finish when outer source ends', () => {
    const values: Signal<any>[] = [];
    const teardown = jest.fn();
    const fn = (signal: Signal<any>) => {
      values.push(signal);
      if (signal !== SignalKind.End && signal.tag === SignalKind.Start) {
        signal[0](TalkbackKind.Pull);
        signal[0](TalkbackKind.Close);
      }
    };

    operators.mergeMap(() => {
      return sources.make(() => teardown);
    })(sources.fromValue(null))(fn);

    expect(teardown).toHaveBeenCalled();
    expect(values).toEqual([start(expect.any(Function))]);
  });

  // This asynchronous test for mergeMap will behave differently than concatMap & switchMap
  it('emits values from each flattened asynchronous source simultaneously', () => {
    const source = operators.delay<number>(4)(sources.fromArray([1, 10]));
    const fn = jest.fn();

    sinks.forEach(fn)(
      operators.mergeMap((x: number) => {
        return operators.delay(5)(sources.fromArray([x, x * 2]));
      })(source)
    );

    jest.runAllTimers();
    expect(fn.mock.calls).toEqual([[1], [10], [2], [20]]);
  });

  it('emits synchronous values in order', () => {
    const values: any[] = [];

    sinks.forEach(x => values.push(x))(
      operators.merge([sources.fromArray([1, 2]), sources.fromArray([3, 4])])
    );

    expect(values).toEqual([1, 2, 3, 4]);
  });
});

describe('onEnd', () => {
  const noop = operators.onEnd(() => {});
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesStrictEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);

  it('calls a callback when the source ends', () => {
    const { source, next, complete } = sources.makeSubject<any>();
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
  passesStrictEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);

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
  passesAsyncSequence(noop);

  it('is called when the source starts', () => {
    let sink: Sink<any>;

    const fn = jest.fn();
    const source: Source<any> = _sink => {
      sink = _sink;
    };

    sinks.forEach(() => {})(operators.onStart(fn)(source));

    expect(fn).not.toHaveBeenCalled();

    sink!(start(() => {}));
    expect(fn).toHaveBeenCalled();
  });
});

describe('sample', () => {
  const valueThenNever: Source<any> = sink =>
    sink(
      start(signal => {
        if (signal === TalkbackKind.Pull) sink(push(null));
      })
    );

  const noop = operators.sample(valueThenNever);

  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourcePushThenEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);

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
  const noop = operators.scan<any, any>((_acc, x) => x, null);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);

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
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  it('shares output values between sinks', () => {
    let onPush = () => {};

    const source: Source<any> = operators.share(sink => {
      sink(start(() => {}));
      onPush = () => {
        sink(push([0]));
        sink(SignalKind.End);
      };
    });

    const fnA = jest.fn();
    const fnB = jest.fn();

    sinks.forEach(fnA)(source);
    sinks.forEach(fnB)(source);
    onPush();

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
  passesAsyncSequence(noop);

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
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);
  passesStrictEnd(noop);

  it('skips values until the notifier source emits', () => {
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
  passesAsyncSequence(noop);

  it('skips values until one fails a predicate', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.skipWhile((x: any) => x <= 1)(source));

    next(1);
    expect(fn).not.toHaveBeenCalled();
    next(2);
    expect(fn).toHaveBeenCalledWith(2);
  });
});

describe('switchMap', () => {
  const noop = operators.switchMap(x => sources.fromValue(x));
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourcePushThenEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  // This synchronous test for switchMap will behave the same as concatMap & mergeMap
  it('emits values from each flattened synchronous source', () => {
    const { source, next, complete } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.switchMap((x: number) => sources.fromArray([x, x + 1]))(source)(fn);

    next(1);
    next(3);
    complete();

    expect(fn).toHaveBeenCalledTimes(6);
    expect(fn.mock.calls).toEqual([
      [start(expect.any(Function))],
      [push(1)],
      [push(2)],
      [push(3)],
      [push(4)],
      [SignalKind.End],
    ]);
  });

  // This synchronous test for switchMap will behave the same as concatMap & mergeMap
  it('lets inner sources finish when outer source ends', () => {
    const signals: Signal<any>[] = [];
    const teardown = jest.fn();
    const fn = (signal: Signal<any>) => {
      signals.push(signal);
      if (signal !== SignalKind.End && signal.tag === SignalKind.Start) {
        signal[0](TalkbackKind.Pull);
        signal[0](TalkbackKind.Close);
      }
    };

    operators.switchMap(() => {
      return sources.make(() => teardown);
    })(sources.fromValue(null))(fn);

    expect(teardown).toHaveBeenCalled();
    expect(signals).toEqual([start(expect.any(Function))]);
  });

  // This asynchronous test for switchMap will behave differently than concatMap & mergeMap
  it('emits values from each flattened asynchronous source, one at a time', () => {
    const source = operators.delay<number>(4)(sources.fromArray([1, 10]));
    const fn = jest.fn();

    sinks.forEach(fn)(
      operators.switchMap((x: number) =>
        operators.take(2)(operators.map((y: number) => x * (y + 1))(sources.interval(5)))
      )(source)
    );

    jest.runAllTimers();
    expect(fn.mock.calls).toEqual([[1], [10], [20]]);
  });
});

describe('take', () => {
  const noop = operators.take(10);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  passesCloseAndEnd(operators.take(0));

  it('emits values until a maximum is reached', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.take(1)(source)(fn);
    next(1);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls).toEqual([[start(expect.any(Function))], [push(1)], [SignalKind.End]]);
  });
});

describe('takeUntil', () => {
  const noop = operators.takeUntil(sources.never);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourcePushThenEnd(noop);
  passesSingleStart(noop);
  passesStrictEnd(noop);
  passesAsyncSequence(noop);

  const ending = operators.takeUntil(sources.fromValue(null));
  passesCloseAndEnd(ending);

  it('emits values until a notifier emits', () => {
    const { source: notifier$, next: notify } = sources.makeSubject<any>();
    const { source: input$, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.takeUntil(notifier$)(input$)(fn);
    next(1);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls).toEqual([[start(expect.any(Function))], [push(1)]]);

    notify(null);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls[2][0]).toEqual(SignalKind.End);
  });
});

describe('takeWhile', () => {
  const noop = operators.takeWhile(() => true);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);

  const ending = operators.takeWhile(() => false);
  passesCloseAndEnd(ending);

  it('emits values while a predicate passes for all values', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    operators.takeWhile((x: any) => x < 2)(source)(fn);
    next(1);
    next(2);

    expect(fn.mock.calls).toEqual([[start(expect.any(Function))], [push(1)], [SignalKind.End]]);
  });
});

describe('takeLast', () => {
  passesCloseAndEnd(operators.takeLast(0));

  it('emits the last max values of an ended source', () => {
    const { source, next, complete } = sources.makeSubject<number>();
    const signals: Signal<any>[] = [];

    let talkback: TalkbackFn;

    operators.takeLast(1)(source)(signal => {
      signals.push(signal);
      if (signal === SignalKind.End) {
        /*noop*/
      } else if (signal.tag === SignalKind.Start) {
        (talkback = signal[0])(TalkbackKind.Pull);
      } else {
        talkback!(TalkbackKind.Pull);
      }
    });

    next(1);
    next(2);

    expect(signals.length).toBe(0);
    complete();

    expect(signals).toEqual([start(expect.any(Function)), push(2), SignalKind.End]);
  });
});

describe('throttle', () => {
  const noop = operators.throttle(() => 0);
  passesPassivePull(noop);
  passesActivePush(noop);
  passesSinkClose(noop);
  passesSourceEnd(noop);
  passesSingleStart(noop);
  passesAsyncSequence(noop);

  it('should ignore emissions for a period of time after a value', () => {
    const { source, next } = sources.makeSubject<number>();
    const fn = jest.fn();

    sinks.forEach(fn)(operators.throttle(() => 100)(source));

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
