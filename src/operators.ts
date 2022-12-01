import { Source, Sink, Operator, SignalKind, TalkbackKind, TalkbackFn } from './types';
import { push, start, talkbackPlaceholder } from './helpers';
import { fromArray } from './sources';

const identity = <T>(x: T): T => x;

export function buffer<S, T>(notifier: Source<S>): Operator<T, T[]> {
  return source => sink => {
    let buffer: T[] = [];
    let sourceTalkback = talkbackPlaceholder;
    let notifierTalkback = talkbackPlaceholder;
    let pulled = false;
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        notifierTalkback(TalkbackKind.Close);
        if (buffer.length) sink(push(buffer));
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        sourceTalkback = signal[0];
        notifier(signal => {
          if (ended) {
            /*noop*/
          } else if (signal === SignalKind.End) {
            ended = true;
            sourceTalkback(TalkbackKind.Close);
            if (buffer.length) sink(push(buffer));
            sink(SignalKind.End);
          } else if (signal.tag === SignalKind.Start) {
            notifierTalkback = signal[0];
          } else if (buffer.length) {
            const signal = push(buffer);
            buffer = [];
            sink(signal);
          }
        });
      } else {
        buffer.push(signal[0]);
        if (!pulled) {
          pulled = true;
          sourceTalkback(TalkbackKind.Pull);
          notifierTalkback(TalkbackKind.Pull);
        } else {
          pulled = false;
        }
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close && !ended) {
          ended = true;
          sourceTalkback(TalkbackKind.Close);
          notifierTalkback(TalkbackKind.Close);
        } else if (!ended && !pulled) {
          pulled = true;
          sourceTalkback(TalkbackKind.Pull);
          notifierTalkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function concatMap<In, Out>(map: (value: In) => Source<Out>): Operator<In, Out> {
  return source => sink => {
    const inputQueue: In[] = [];
    let outerTalkback = talkbackPlaceholder;
    let innerTalkback = talkbackPlaceholder;
    let outerPulled = false;
    let innerPulled = false;
    let innerActive = false;
    let ended = false;
    function applyInnerSource(innerSource: Source<Out>): void {
      innerActive = true;
      innerSource(signal => {
        if (signal === SignalKind.End) {
          if (innerActive) {
            innerActive = false;
            if (inputQueue.length) {
              applyInnerSource(map(inputQueue.shift()!));
            } else if (ended) {
              sink(SignalKind.End);
            } else if (!outerPulled) {
              outerPulled = true;
              outerTalkback(TalkbackKind.Pull);
            }
          }
        } else if (signal.tag === SignalKind.Start) {
          innerPulled = false;
          (innerTalkback = signal[0])(TalkbackKind.Pull);
        } else if (innerActive) {
          sink(signal);
          if (innerPulled) {
            innerPulled = false;
          } else {
            innerTalkback(TalkbackKind.Pull);
          }
        }
      });
    }
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        if (!innerActive && !inputQueue.length) sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        outerTalkback = signal[0];
      } else {
        outerPulled = false;
        if (innerActive) {
          inputQueue.push(signal[0]);
        } else {
          applyInnerSource(map(signal[0]));
        }
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          if (!ended) {
            ended = true;
            outerTalkback(TalkbackKind.Close);
          }
          if (innerActive) {
            innerActive = false;
            innerTalkback(TalkbackKind.Close);
          }
        } else {
          if (!ended && !outerPulled) {
            outerPulled = true;
            outerTalkback(TalkbackKind.Pull);
          }
          if (innerActive && !innerPulled) {
            innerPulled = true;
            innerTalkback(TalkbackKind.Pull);
          }
        }
      })
    );
  };
}

export function concatAll<T>(source: Source<Source<T>>): Source<T> {
  return concatMap<Source<T>, T>(identity)(source);
}

export function concat<T>(sources: Source<T>[]): Source<T> {
  return concatAll(fromArray(sources));
}

export function filter<T>(predicate: (value: T) => boolean): Operator<T, T> {
  return source => sink => {
    let talkback = talkbackPlaceholder;
    source(signal => {
      if (signal === SignalKind.End) {
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        talkback = signal[0];
        sink(signal);
      } else if (!predicate(signal[0])) {
        talkback(TalkbackKind.Pull);
      } else {
        sink(signal);
      }
    });
  };
}

export function map<In, Out>(map: (value: In) => Out): Operator<In, Out> {
  return source => sink =>
    source(signal => {
      if (signal === SignalKind.End || signal.tag === SignalKind.Start) {
        sink(signal);
      } else {
        sink(push(map(signal[0])));
      }
    });
}

export function mergeMap<In, Out>(map: (value: In) => Source<Out>): Operator<In, Out> {
  return source => sink => {
    let innerTalkbacks: TalkbackFn[] = [];
    let outerTalkback = talkbackPlaceholder;
    let outerPulled = false;
    let ended = false;
    function applyInnerSource(innerSource: Source<Out>): void {
      let talkback = talkbackPlaceholder;
      innerSource(signal => {
        if (signal === SignalKind.End) {
          if (innerTalkbacks.length) {
            const index = innerTalkbacks.indexOf(talkback);
            if (index > -1) (innerTalkbacks = innerTalkbacks.slice()).splice(index, 1);
            if (!innerTalkbacks.length) {
              if (ended) {
                sink(SignalKind.End);
              } else if (!outerPulled) {
                outerPulled = true;
                outerTalkback(TalkbackKind.Pull);
              }
            }
          }
        } else if (signal.tag === SignalKind.Start) {
          innerTalkbacks.push((talkback = signal[0]));
          talkback(TalkbackKind.Pull);
        } else if (innerTalkbacks.length) {
          sink(signal);
          talkback(TalkbackKind.Pull);
        }
      });
    }
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        if (!innerTalkbacks.length) sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        outerTalkback = signal[0];
      } else {
        outerPulled = false;
        applyInnerSource(map(signal[0]));
        if (!outerPulled) {
          outerPulled = true;
          outerTalkback(TalkbackKind.Pull);
        }
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          if (!ended) {
            ended = true;
            outerTalkback(TalkbackKind.Close);
          }
          for (let i = 0, a = innerTalkbacks, l = innerTalkbacks.length; i < l; i++)
            a[i](TalkbackKind.Close);
          innerTalkbacks.length = 0;
        } else {
          if (!ended && !outerPulled) {
            outerPulled = true;
            outerTalkback(TalkbackKind.Pull);
          } else {
            outerPulled = false;
          }
          for (let i = 0, a = innerTalkbacks, l = innerTalkbacks.length; i < l; i++)
            a[i](TalkbackKind.Pull);
        }
      })
    );
  };
}

export function mergeAll<T>(source: Source<Source<T>>): Source<T> {
  return mergeMap<Source<T>, T>(identity)(source);
}

export function merge<T>(sources: Source<T>[]): Source<T> {
  return mergeAll(fromArray(sources));
}

export function onEnd<T>(callback: () => void): Operator<T, T> {
  return source => sink => {
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        sink(SignalKind.End);
        callback();
      } else if (signal.tag === SignalKind.Start) {
        const talkback = signal[0];
        sink(
          start(signal => {
            if (signal === TalkbackKind.Close) {
              ended = true;
              talkback(TalkbackKind.Close);
              callback();
            } else {
              talkback(signal);
            }
          })
        );
      } else {
        sink(signal);
      }
    });
  };
}

export function onPush<T>(callback: (value: T) => void): Operator<T, T> {
  return source => sink => {
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        const talkback = signal[0];
        sink(
          start(signal => {
            if (signal === TalkbackKind.Close) ended = true;
            talkback(signal);
          })
        );
      } else {
        callback(signal[0]);
        sink(signal);
      }
    });
  };
}

export function onStart<T>(callback: () => void): Operator<T, T> {
  return source => sink =>
    source(signal => {
      if (signal === SignalKind.End) {
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        sink(signal);
        callback();
      } else {
        sink(signal);
      }
    });
}

export function sample<S, T>(notifier: Source<S>): Operator<T, T> {
  return source => sink => {
    let sourceTalkback = talkbackPlaceholder;
    let notifierTalkback = talkbackPlaceholder;
    let value: T | void;
    let pulled = false;
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        notifierTalkback(TalkbackKind.Close);
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        sourceTalkback = signal[0];
      } else {
        value = signal[0];
        if (!pulled) {
          pulled = true;
          notifierTalkback(TalkbackKind.Pull);
          sourceTalkback(TalkbackKind.Pull);
        } else {
          pulled = false;
        }
      }
    });
    notifier(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        sourceTalkback(TalkbackKind.Close);
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        notifierTalkback = signal[0];
      } else if (value !== undefined) {
        const signal = push(value);
        value = undefined;
        sink(signal);
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close && !ended) {
          ended = true;
          sourceTalkback(TalkbackKind.Close);
          notifierTalkback(TalkbackKind.Close);
        } else if (!ended && !pulled) {
          pulled = true;
          sourceTalkback(TalkbackKind.Pull);
          notifierTalkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function scan<In, Out>(reducer: (acc: Out, value: In) => Out, seed: Out): Operator<In, Out> {
  return source => sink => {
    let acc = seed;
    source(signal => {
      if (signal === SignalKind.End) {
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        sink(signal);
      } else {
        sink(push((acc = reducer(acc, signal[0]))));
      }
    });
  };
}

export function share<T>(source: Source<T>): Source<T> {
  let sinks: Sink<T>[] = [];
  let talkback = talkbackPlaceholder;
  let gotSignal = false;
  return sink => {
    sinks.push(sink);
    if (sinks.length === 1) {
      source(signal => {
        if (signal === SignalKind.End) {
          for (let i = 0, a = sinks, l = sinks.length; i < l; i++) a[i](SignalKind.End);
          sinks.length = 0;
        } else if (signal.tag === SignalKind.Start) {
          talkback = signal[0];
        } else {
          gotSignal = false;
          for (let i = 0, a = sinks, l = sinks.length; i < l; i++) a[i](signal);
        }
      });
    }
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          const index = sinks.indexOf(sink);
          if (index > -1) (sinks = sinks.slice()).splice(index, 1);
          if (!sinks.length) talkback(TalkbackKind.Close);
        } else if (!gotSignal) {
          gotSignal = true;
          talkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function skip<T>(wait: number): Operator<T, T> {
  return source => sink => {
    let talkback = talkbackPlaceholder;
    let rest = wait;
    source(signal => {
      if (signal === SignalKind.End) {
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        talkback = signal[0];
        sink(signal);
      } else if (rest-- > 0) {
        talkback(TalkbackKind.Pull);
      } else {
        sink(signal);
      }
    });
  };
}

export function skipUntil<S, T>(notifier: Source<S>): Operator<T, T> {
  return source => sink => {
    let sourceTalkback = talkbackPlaceholder;
    let notifierTalkback = talkbackPlaceholder;
    let skip = true;
    let pulled = false;
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        if (skip) notifierTalkback(TalkbackKind.Close);
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        sourceTalkback = signal[0];
        notifier(signal => {
          if (signal === SignalKind.End) {
            if (skip) {
              ended = true;
              sourceTalkback(TalkbackKind.Close);
            }
          } else if (signal.tag === SignalKind.Start) {
            (notifierTalkback = signal[0])(TalkbackKind.Pull);
          } else {
            skip = false;
            notifierTalkback(TalkbackKind.Close);
          }
        });
      } else if (!skip) {
        pulled = false;
        sink(signal);
      } else if (!pulled) {
        pulled = true;
        sourceTalkback(TalkbackKind.Pull);
        notifierTalkback(TalkbackKind.Pull);
      } else {
        pulled = false;
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close && !ended) {
          ended = true;
          sourceTalkback(TalkbackKind.Close);
          if (skip) notifierTalkback(TalkbackKind.Close);
        } else if (!ended && !pulled) {
          pulled = true;
          if (skip) notifierTalkback(TalkbackKind.Pull);
          sourceTalkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function skipWhile<T>(predicate: (value: T) => boolean): Operator<T, T> {
  return source => sink => {
    let talkback = talkbackPlaceholder;
    let skip = true;
    source(signal => {
      if (signal === SignalKind.End) {
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        talkback = signal[0];
        sink(signal);
      } else if (skip) {
        if (predicate(signal[0])) {
          talkback(TalkbackKind.Pull);
        } else {
          skip = false;
          sink(signal);
        }
      } else {
        sink(signal);
      }
    });
  };
}

export function switchMap<In, Out>(map: (value: In) => Source<Out>): Operator<In, Out> {
  return source => sink => {
    let outerTalkback = talkbackPlaceholder;
    let innerTalkback = talkbackPlaceholder;
    let outerPulled = false;
    let innerPulled = false;
    let innerActive = false;
    let ended = false;
    function applyInnerSource(innerSource: Source<Out>): void {
      innerActive = true;
      innerSource(signal => {
        if (!innerActive) {
          /*noop*/
        } else if (signal === SignalKind.End) {
          innerActive = false;
          if (ended) {
            sink(SignalKind.End);
          } else if (!outerPulled) {
            outerPulled = true;
            outerTalkback(TalkbackKind.Pull);
          }
        } else if (signal.tag === SignalKind.Start) {
          innerPulled = false;
          (innerTalkback = signal[0])(TalkbackKind.Pull);
        } else {
          sink(signal);
          if (!innerPulled) {
            innerTalkback(TalkbackKind.Pull);
          } else {
            innerPulled = false;
          }
        }
      });
    }
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        if (!innerActive) sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        outerTalkback = signal[0];
      } else {
        if (innerActive) {
          innerTalkback(TalkbackKind.Close);
          innerTalkback = talkbackPlaceholder;
        }
        if (!outerPulled) {
          outerPulled = true;
          outerTalkback(TalkbackKind.Pull);
        } else {
          outerPulled = false;
        }
        applyInnerSource(map(signal[0]));
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close) {
          if (!ended) {
            ended = true;
            outerTalkback(TalkbackKind.Close);
          }
          if (innerActive) {
            innerActive = false;
            innerTalkback(TalkbackKind.Close);
          }
        } else {
          if (!ended && !outerPulled) {
            outerPulled = true;
            outerTalkback(TalkbackKind.Pull);
          }
          if (innerActive && !innerPulled) {
            innerPulled = true;
            innerTalkback(TalkbackKind.Pull);
          }
        }
      })
    );
  };
}

export function switchAll<T>(source: Source<Source<T>>): Source<T> {
  return switchMap<Source<T>, T>(identity)(source);
}

export function take<T>(max: number): Operator<T, T> {
  return source => sink => {
    let talkback = talkbackPlaceholder;
    let ended = false;
    let taken = 0;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        if (max <= 0) {
          ended = true;
          sink(SignalKind.End);
          signal[0](TalkbackKind.Close);
        } else {
          talkback = signal[0];
        }
      } else if (taken++ < max) {
        sink(signal);
        if (!ended && taken >= max) {
          ended = true;
          sink(SignalKind.End);
          talkback(TalkbackKind.Close);
        }
      } else {
        sink(signal);
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close && !ended) {
          ended = true;
          talkback(TalkbackKind.Close);
        } else if (signal === TalkbackKind.Pull && !ended && taken < max) {
          talkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function takeLast<T>(max: number): Operator<T, T> {
  return source => sink => {
    const queue: T[] = [];
    let talkback = talkbackPlaceholder;
    source(signal => {
      if (signal === SignalKind.End) {
        fromArray(queue)(sink);
      } else if (signal.tag === SignalKind.Start) {
        if (max <= 0) {
          signal[0](TalkbackKind.Close);
          fromArray(queue)(sink);
        } else {
          (talkback = signal[0])(TalkbackKind.Pull);
        }
      } else {
        if (queue.length >= max && max) queue.shift();
        queue.push(signal[0]);
        talkback(TalkbackKind.Pull);
      }
    });
  };
}

export function takeUntil<S, T>(notifier: Source<S>): Operator<T, T> {
  return source => sink => {
    let sourceTalkback = talkbackPlaceholder;
    let notifierTalkback = talkbackPlaceholder;
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        notifierTalkback(TalkbackKind.Close);
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        sourceTalkback = signal[0];
        notifier(signal => {
          if (signal === SignalKind.End) {
            /*noop*/
          } else if (signal.tag === SignalKind.Start) {
            (notifierTalkback = signal[0])(TalkbackKind.Pull);
          } else {
            ended = true;
            notifierTalkback(TalkbackKind.Close);
            sourceTalkback(TalkbackKind.Close);
            sink(SignalKind.End);
          }
        });
      } else {
        sink(signal);
      }
    });
    sink(
      start(signal => {
        if (signal === TalkbackKind.Close && !ended) {
          ended = true;
          sourceTalkback(TalkbackKind.Close);
          notifierTalkback(TalkbackKind.Close);
        } else if (!ended) {
          sourceTalkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function takeWhile<T>(predicate: (value: T) => boolean): Operator<T, T> {
  return source => sink => {
    let talkback = talkbackPlaceholder;
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        talkback = signal[0];
        sink(signal);
      } else if (!predicate(signal[0])) {
        ended = true;
        sink(SignalKind.End);
        talkback(TalkbackKind.Close);
      } else {
        sink(signal);
      }
    });
  };
}

export function debounce<T>(timing: (value: T) => number): Operator<T, T> {
  return source => sink => {
    let id: any | void;
    let deferredEnded = false;
    let ended = false;
    source(signal => {
      if (ended) {
        /*noop*/
      } else if (signal === SignalKind.End) {
        ended = true;
        if (id) {
          deferredEnded = true;
        } else {
          sink(SignalKind.End);
        }
      } else if (signal.tag === SignalKind.Start) {
        const talkback = signal[0];
        sink(
          start(signal => {
            if (signal === TalkbackKind.Close && !ended) {
              ended = true;
              deferredEnded = false;
              if (id) clearTimeout(id);
              talkback(TalkbackKind.Close);
            } else if (!ended) {
              talkback(TalkbackKind.Pull);
            }
          })
        );
      } else {
        if (id) clearTimeout(id);
        id = setTimeout(() => {
          id = undefined;
          sink(signal);
          if (deferredEnded) sink(SignalKind.End);
        }, timing(signal[0]));
      }
    });
  };
}

export function delay<T>(wait: number): Operator<T, T> {
  return source => sink => {
    let active = 0;
    source(signal => {
      if (signal !== SignalKind.End && signal.tag === SignalKind.Start) {
        sink(signal);
      } else {
        active++;
        setTimeout(() => {
          if (active) {
            active--;
            sink(signal);
          }
        }, wait);
      }
    });
  };
}

export function throttle<T>(timing: (value: T) => number): Operator<T, T> {
  return source => sink => {
    let skip = false;
    let id: any | void;
    source(signal => {
      if (signal === SignalKind.End) {
        if (id) clearTimeout(id);
        sink(SignalKind.End);
      } else if (signal.tag === SignalKind.Start) {
        const talkback = signal[0];
        sink(
          start(signal => {
            if (signal === TalkbackKind.Close) {
              if (id) clearTimeout(id);
              talkback(TalkbackKind.Close);
            } else {
              talkback(TalkbackKind.Pull);
            }
          })
        );
      } else if (!skip) {
        skip = true;
        if (id) clearTimeout(id);
        id = setTimeout(() => {
          id = undefined;
          skip = false;
        }, timing(signal[0]));
        sink(signal);
      }
    });
  };
}

export { mergeAll as flatten, onPush as tap };
