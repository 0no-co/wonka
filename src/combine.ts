import { Source, SignalKind, TalkbackKind, TalkbackFn } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

export function zip<T>(sources: Source<T>[]): Source<T[]>;
export function zip<A, B>(sources: [Source<A>, Source<B>]): Source<[A, B]>;
export function zip<A, B, C>(sources: [Source<A>, Source<B>, Source<C>]): Source<[A, B, C]>;

export function zip<A, B, C, D>(
  sources: [Source<A>, Source<B>, Source<C>, Source<D>]
): Source<[A, B, C, D]>;

export function zip<A, B, C, D, E>(
  sources: [Source<A>, Source<B>, Source<C>, Source<D>, Source<E>]
): Source<[A, B, C, D, E]>;

export function zip<A, B, C, D, E, F>(
  sources: [Source<A>, Source<B>, Source<C>, Source<D>, Source<E>, Source<F>]
): Source<[A, B, C, D, E, F]>;

export function zip<A, B, C, D, E, F, G>(
  sources: [Source<A>, Source<B>, Source<C>, Source<D>, Source<E>, Source<F>, Source<G>]
): Source<[A, B, C, D, E, F, G]>;

export function zip<A, B, C, D, E, F, G, H>(
  sources: [Source<A>, Source<B>, Source<C>, Source<D>, Source<E>, Source<F>, Source<G>, Source<H>]
): Source<[A, B, C, D, E, F, G, H]>;

export function zip<T>(sources: Source<T>[]): Source<T[]> {
  return sink => {
    const filled: boolean[] = new Array(sources.length).fill(false);
    const talkbacks: TalkbackFn[] = new Array(sources.length).fill(talkbackPlaceholder);
    const buffer: T[] = new Array(sources.length).fill(undefined);

    let gotBuffer = false;
    let gotSignal = false;
    let ended = false;
    let endCount = 0;

    for (let index = 0; index < sources.length; index++) {
      sources[index](signal => {
        if (signal === SignalKind.End) {
          if (endCount >= sources.length - 1) {
            ended = true;
            sink(SignalKind.End);
          } else {
            endCount++;
          }
        } else if (signal.tag === SignalKind.Start) {
          talkbacks[index] = signal[0];
        } else if (!ended) {
          buffer[index] = signal[0];
          filled[index] = true;
          if (!gotBuffer && filled.includes(false)) {
            if (!gotSignal) {
              for (let index = 0; index < sources.length; index++)
                if (!filled[index]) talkbacks[index](TalkbackKind.Pull);
            } else {
              gotSignal = false;
            }
          } else {
            gotBuffer = true;
            gotSignal = false;
            sink(push(buffer.slice()));
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
          for (const talkback of talkbacks) talkback(TalkbackKind.Close);
        } else if (!gotSignal) {
          gotSignal = true;
          for (const talkback of talkbacks) talkback(TalkbackKind.Pull);
        }
      })
    );
  };
}

export function combine<T>(...sources: Source<T>[]): Source<T[]>;
export function combine<A, B>(a: Source<A>, b: Source<B>): Source<[A, B]>;
export function combine<A, B, C>(a: Source<A>, b: Source<B>, c: Source<C>): Source<[A, B, C]>;

export function combine<A, B, C, D>(
  a: Source<A>,
  b: Source<B>,
  c: Source<C>,
  d: Source<D>
): Source<[A, B, C, D]>;

export function combine<A, B, C, D, E>(
  a: Source<A>,
  b: Source<B>,
  c: Source<C>,
  d: Source<D>,
  e: Source<E>
): Source<[A, B, C, D, E]>;

export function combine<A, B, C, D, E, F>(
  a: Source<A>,
  b: Source<B>,
  c: Source<C>,
  d: Source<D>,
  e: Source<E>,
  f: Source<F>
): Source<[A, B, C, D, E, F]>;

export function combine<A, B, C, D, E, F, G>(
  a: Source<A>,
  b: Source<B>,
  c: Source<C>,
  d: Source<D>,
  e: Source<E>,
  f: Source<F>,
  g: Source<G>
): Source<[A, B, C, D, E, F, G]>;

export function combine<A, B, C, D, E, F, G, H>(
  a: Source<A>,
  b: Source<B>,
  c: Source<C>,
  d: Source<D>,
  e: Source<E>,
  f: Source<F>,
  g: Source<G>,
  h: Source<H>
): Source<[A, B, C, D, E, F, G, H]>;

export function combine<T>(...sources: Source<T>[]): Source<T[]> {
  return zip(sources);
}
