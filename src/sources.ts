import { Source, Sink, SignalKind, TalkbackKind, Observer, Subject, TeardownFn } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

export function fromArray<T>(array: T[]): Source<T> {
  return sink => {
    let ended = false;
    let looping = false;
    let pulled = false;
    let current = 0;
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          ended = true;
        } else if (looping) {
          pulled = true;
        } else {
          for (pulled = looping = true; pulled && !ended; current++) {
            if (current < array.length) {
              pulled = false;
              sink(push(array[current]));
            } else {
              ended = true;
              sink(SignalKind.End);
            }
          }
          looping = false;
        }
      })
    );
  };
}

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
