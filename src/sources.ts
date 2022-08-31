import { Source, Sink, SignalKind, TalkbackKind, Observer, Subject, TeardownFn } from './types';
import { push, start, talkbackPlaceholder, teardownPlaceholder } from './helpers';
import { share } from './operators';

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
  let next: Subject<T>['next'] | void;
  let complete: Subject<T>['complete'] | void;
  return {
    source: share(
      make(observer => {
        next = observer.next;
        complete = observer.complete;
        return teardownPlaceholder;
      })
    ),
    next(value: T) {
      if (next) next(value);
    },
    complete() {
      if (complete) complete();
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
  return make(observer => {
    let i = 0;
    const id = setInterval(() => observer.next(i++), ms);
    return () => clearInterval(id);
  });
}

export function fromDomEvent(element: HTMLElement, event: string): Source<Event> {
  return make(observer => {
    element.addEventListener(event, observer.next);
    return () => element.removeEventListener(event, observer.next);
  });
}

export function fromPromise<T>(promise: Promise<T>): Source<T> {
  return make(observer => {
    promise.then(value => {
      Promise.resolve(value).then(() => {
        observer.next(value);
        observer.complete();
      });
    });
    return teardownPlaceholder;
  });
}
