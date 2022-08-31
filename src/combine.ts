import { Source, TypeOfSource, SignalKind, TalkbackKind, TalkbackFn } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

type TypeOfSourceArray<T extends readonly [...any[]]> = T extends [infer Head, ...infer Tail]
  ? [TypeOfSource<Head>, ...TypeOfSourceArray<Tail>]
  : [];

export function zip<Sources extends readonly [...Source<any>[]]>(
  sources: [...Sources]
): Source<TypeOfSourceArray<Sources>>;

export function zip<Sources extends { [prop: string]: Source<any> }>(
  sources: Sources
): Source<{ [Property in keyof Sources]: TypeOfSource<Sources[Property]> }>;

export function zip<T>(
  sources: Source<T>[] | Record<string, Source<T>>
): Source<T[] | Record<string, T>> {
  const size = Object.keys(sources).length;
  return sink => {
    const filled: Set<string | number> = new Set();

    const talkbacks: TalkbackFn[] | Record<string, TalkbackFn | void> = Array.isArray(sources)
      ? new Array(size).fill(talkbackPlaceholder)
      : {};
    const buffer: T[] | Record<string, T> = Array.isArray(sources) ? new Array(size) : {};

    let gotBuffer = false;
    let gotSignal = false;
    let ended = false;
    let endCount = 0;

    for (const key in sources) {
      (sources[key] as Source<T>)(signal => {
        if (signal === SignalKind.End) {
          if (endCount >= size - 1) {
            ended = true;
            sink(SignalKind.End);
          } else {
            endCount++;
          }
        } else if (signal.tag === SignalKind.Start) {
          talkbacks[key] = signal[0];
        } else if (!ended) {
          buffer[key] = signal[0];
          filled.add(key);
          if (!gotBuffer && filled.size < size) {
            if (!gotSignal) {
              for (const key in sources)
                if (!filled.has(key)) (talkbacks[key] || talkbackPlaceholder)(TalkbackKind.Pull);
            } else {
              gotSignal = false;
            }
          } else {
            gotBuffer = true;
            gotSignal = false;
            sink(push(Array.isArray(buffer) ? buffer.slice() : { ...buffer }));
          }
        }
      });
    }
    sink(
      start(signal => {
        if (ended) {
          /*noop*/
        } else if (signal === TalkbackKind.Close) {
          ended = true;
          for (const key in talkbacks) talkbacks[key](TalkbackKind.Close);
        } else if (!gotSignal) {
          gotSignal = true;
          for (const key in talkbacks) talkbacks[key](TalkbackKind.Pull);
        }
      })
    );
  };
}

export function combine<Sources extends Source<any>[]>(
  ...sources: Sources
): Source<TypeOfSourceArray<Sources>> {
  return zip(sources) as Source<any>;
}
