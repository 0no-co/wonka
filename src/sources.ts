import { Source, Sink, SignalKind, TalkbackKind, Observer, Subject, TeardownFn } from './types';
import { push, start, talkbackPlaceholder, teardownPlaceholder } from './helpers';
import { share } from './operators';

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
              try {
                pulled = false;
                sink(push(next.value));
              } catch (error) {
                if (iterator.throw) {
                  if ((ended = !!(await iterator.throw(error)).done)) sink(SignalKind.End);
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

export function fromIterable<T>(iterable: Iterable<T> | AsyncIterable<T>): Source<T> {
  if (iterable[Symbol.asyncIterator]) return fromAsyncIterable(iterable as AsyncIterable<T>);
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
              try {
                pulled = false;
                sink(push(next.value));
              } catch (error) {
                if (iterator.throw) {
                  if ((ended = !!iterator.throw(error).done)) sink(SignalKind.End);
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
