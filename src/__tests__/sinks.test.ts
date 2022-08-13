import { Source, Sink, SignalKind, TalkbackKind } from '../types';
import { push, start } from '../helpers';

import * as sinks from '../sinks';
import * as sources from '../sources';
import * as callbag from '../callbag';
import * as observable from '../observable';

import Observable from 'zen-observable';
import callbagIterate from 'callbag-iterate';
import callbagTake from 'callbag-take';

describe('subscribe', () => {
  it('sends Pull talkback signals every Push signal', () => {
    let pulls = 0;
    const fn = jest.fn();

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            if (pulls < 3) {
              pulls++;
              sink(push(0));
            } else {
              sink(SignalKind.End);
              expect(pulls).toBe(3);
            }
          }
        })
      );
    };

    sinks.subscribe(fn)(source);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(pulls).toBe(3);
  });

  it('cancels when unsubscribe is called', () => {
    let pulls = 0;
    let closing = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            if (!pulls) {
              pulls++;
              sink(push(0));
            }
          } else {
            closing++;
          }
        })
      );
    };

    const sub = sinks.subscribe(() => {})(source);
    expect(pulls).toBe(1);

    sub.unsubscribe();
    expect(closing).toBe(1);
  });

  it('ignores cancellation when the source has already ended', () => {
    let pulls = 0;
    let closing = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            pulls++;
            sink(SignalKind.End);
          } else {
            closing++;
          }
        })
      );
    };

    const sub = sinks.subscribe(() => {})(source);
    expect(pulls).toBe(1);
    sub.unsubscribe();
    expect(closing).toBe(0);
  });

  it('ignores Push signals after the source has ended', () => {
    const fn = jest.fn();
    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            sink(SignalKind.End);
            sink(push(0));
          }
        })
      );
    };

    sinks.subscribe(fn)(source);
    expect(fn).not.toHaveBeenCalled();
  });

  it('ignores Push signals after cancellation', () => {
    const fn = jest.fn();
    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Close) {
            sink(push(0));
          }
        })
      );
    };

    sinks.subscribe(fn)(source).unsubscribe();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('publish', () => {
  it('sends Pull talkback signals every Push signal', () => {
    let pulls = 0;
    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            if (pulls < 3) {
              pulls++;
              sink(push(0));
            } else {
              sink(SignalKind.End);
              expect(pulls).toBe(3);
            }
          }
        })
      );
    };

    sinks.publish(source);
    expect(pulls).toBe(3);
  });
});

describe('toArray', () => {
  it('sends Pull talkback signals every Push signal', () => {
    let pulls = 0;
    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            if (pulls < 3) {
              pulls++;
              sink(push(0));
            } else {
              sink(SignalKind.End);
              expect(pulls).toBe(3);
            }
          }
        })
      );
    };

    const array = sinks.toArray(source);
    expect(array).toEqual([0, 0, 0]);
    expect(pulls).toBe(3);
  });

  it('sends a Close talkback signal after all synchronous values have been pulled', () => {
    let pulls = 0;
    let ending = 0;

    const source: Source<any> = sink => {
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            if (!pulls) {
              pulls++;
              sink(push(0));
            }
          } else {
            ending++;
          }
        })
      );
    };

    const array = sinks.toArray(source);
    expect(array).toEqual([0]);
    expect(ending).toBe(1);
  });
});

describe('toPromise', () => {
  it('creates a Promise that resolves on the last value', async () => {
    let pulls = 0;
    let sink: Sink<any> | null = null;

    const source: Source<any> = _sink => {
      sink = _sink;
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) pulls++;
        })
      );
    };

    const fn = jest.fn();
    const promise = sinks.toPromise(source).then(fn);

    expect(pulls).toBe(1);
    sink!(push(0));
    expect(pulls).toBe(2);
    sink!(push(1));
    sink!(SignalKind.End);
    expect(fn).not.toHaveBeenCalled();

    await promise;
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('creates a Promise for synchronous sources', async () => {
    const fn = jest.fn();
    await sinks.toPromise(sources.fromArray([1, 2, 3])).then(fn);
    expect(fn).toHaveBeenCalledWith(3);
  });
});

describe('toObservable', () => {
  it('creates an Observable mirroring the Wonka source', () => {
    const next = jest.fn();
    const complete = jest.fn();
    let pulls = 0;
    let sink: Sink<any> | null = null;

    const source: Source<any> = _sink => {
      sink = _sink;
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) pulls++;
        })
      );
    };

    Observable.from(observable.toObservable(source) as any).subscribe({
      next,
      complete,
    });

    expect(pulls).toBe(1);
    sink!(push(0));
    expect(next).toHaveBeenCalledWith(0);
    sink!(push(1));
    expect(next).toHaveBeenCalledWith(1);
    sink!(SignalKind.End);
    expect(complete).toHaveBeenCalled();
  });

  it('forwards cancellations from the Observable as a talkback', () => {
    let ending = 0;
    const source: Source<any> = sink =>
      sink(
        start(signal => {
          if (signal === TalkbackKind.Close) ending++;
        })
      );

    const sub = Observable.from(observable.toObservable(source) as any).subscribe({});

    expect(ending).toBe(0);
    sub.unsubscribe();
    expect(ending).toBe(1);
  });
});

describe('toCallbag', () => {
  it('creates a Callbag mirroring the Wonka source', () => {
    const fn = jest.fn();
    let pulls = 0;
    let sink: Sink<any> | null = null;

    const source: Source<any> = _sink => {
      sink = _sink;
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) pulls++;
        })
      );
    };

    callbagIterate(fn)(callbag.toCallbag(source));

    expect(pulls).toBe(1);
    sink!(push(0));
    expect(fn).toHaveBeenCalledWith(0);
    sink!(push(1));
    expect(fn).toHaveBeenCalledWith(1);
    sink!(SignalKind.End);
  });

  it('forwards cancellations from the Callbag as a talkback', () => {
    let ending = 0;
    const fn = jest.fn();

    const source: Source<any> = sink =>
      sink(
        start(signal => {
          if (signal === TalkbackKind.Pull) {
            sink(push(0));
          } else {
            ending++;
          }
        })
      );

    callbagIterate(fn)(callbagTake(1)(callbag.toCallbag(source) as any));

    expect(fn.mock.calls).toEqual([[0]]);
    expect(ending).toBe(1);
  });
});
