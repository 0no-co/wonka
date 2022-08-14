import { Source, Sink, SignalKind, TalkbackKind, Observer, Subject, TeardownFn } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

export function lazy<T>(make: () => Source<T>): Source<T> {
  return sink => make()(sink);
}

export function fromAsyncIterable<T>(iterable: AsyncIterable<T>): Source<T> {
  return sink => {
    const iterator = iterable[Symbol.asyncIterator]();
    let ended = false;
    let looping = false;
    let pulled = false;
    let next: IteratorResult<T>;
    sink(
      start(async signal => {
        if (signal === TalkbackKind.Close) {
          ended = true;
          if (iterator.return) iterator.return();
        } else if (looping) {
          pulled = true;
        } else {
          for (pulled = looping = true; pulled && !ended; ) {
            if ((next = await iterator.next()).done) {
              ended = true;
              if (iterator.return) await iterator.return();
              sink(SignalKind.End);
            } else {
              pulled = false;
              try {
                sink(push(next.value));
              } catch (error) {
                if (iterator.throw) {
                  await iterator.throw(error);
                } else {
                  throw error;
                }
              }
            }
          }
          looping = false;
        }
      })
    );
  };
}

export function fromIterable<T>(iterable: Iterable<T>): Source<T> {
  return sink => {
    const iterator = iterable[Symbol.iterator]();
    let ended = false;
    let looping = false;
    let pulled = false;
    let next: IteratorResult<T>;
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          ended = true;
          if (iterator.return) iterator.return();
        } else if (looping) {
          pulled = true;
        } else {
          for (pulled = looping = true; pulled && !ended; ) {
            if ((next = iterator.next()).done) {
              ended = true;
              if (iterator.return) iterator.return();
              sink(SignalKind.End);
            } else {
              pulled = false;
              try {
                sink(push(next.value));
              } catch (error) {
                if (iterator.throw) {
                  iterator.throw(error);
                } else {
                  throw error;
                }
              }
            }
          }
          looping = false;
        }
      })
    );
  };
}

export const fromArray: <T>(array: T[]) => Source<T> = fromIterable;

export function fromValue<T>(value: T): Source<T> {
  return sink => {
    let ended = false;
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          ended = true;
        } else if (!ended) {
          ended = true;
          sink(push(value));
          sink(SignalKind.End);
        }
      })
    );
  };
}

export function make<T>(produce: (observer: Observer<T>) => TeardownFn): Source<T> {
  return sink => {
    let ended = false;
    const teardown = produce({
      next(value: T) {
        if (!ended) sink(push(value));
      },
      complete() {
        if (!ended) {
          ended = true;
          sink(SignalKind.End);
        }
      },
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close && !ended) {
          ended = true;
          teardown();
        }
      })
    );
  };
}

export function makeSubject<T>(): Subject<T> {
  let sinks: Sink<T>[] = [];
  let ended = false;
  return {
    source(sink: Sink<T>) {
      sinks.push(sink);
      sink(
        start(signal => {
          if (signal === TalkbackKind.Close) {
            const index = sinks.indexOf(sink);
            if (index > -1) (sinks = sinks.slice()).splice(index, 1);
          }
        })
      );
    },
    next(value: T) {
      if (!ended) {
        const signal = push(value);
        for (let i = 0, a = sinks, l = sinks.length; i < l; i++) a[i](signal);
      }
    },
    complete() {
      if (!ended) {
        ended = true;
        for (let i = 0, a = sinks, l = sinks.length; i < l; i++) a[i](SignalKind.End);
      }
    },
  };
}

export const empty: Source<any> = (sink: Sink<any>): void => {
  let ended = false;
  sink(
    start(signal => {
      if (signal === TalkbackKind.Close) {
        ended = true;
      } else if (!ended) {
        ended = true;
        sink(SignalKind.End);
      }
    })
  );
};

export const never: Source<any> = (sink: Sink<any>): void => {
  sink(start(talkbackPlaceholder));
};

export function interval(ms: number): Source<number> {
  return sink => {
    let i = 0;
    const id = setInterval(() => {
      sink(push(i++));
    }, ms);
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) clearInterval(id);
      })
    );
  };
}

export function fromDomEvent(element: HTMLElement, event: string): Source<Event> {
  return sink => {
    const handler = (payload: Event) => {
      sink(push(payload));
    };
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) element.removeEventListener(event, handler);
      })
    );
    element.addEventListener(event, handler);
  };
}

export function fromPromise<T>(promise: Promise<T>): Source<T> {
  return sink => {
    let ended = false;
    promise.then(value => {
      if (!ended) {
        sink(push(value));
        sink(SignalKind.End);
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) ended = true;
      })
    );
  };
}
