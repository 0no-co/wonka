import { Source, SignalKind, TalkbackKind, TalkbackFn } from './types';
import { push, start, talkbackPlaceholder } from './helpers';

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

export function combine(...sources: Source<unknown>[]): Source<unknown[]> {
  return sink => {
    const filled: boolean[] = new Array(sources.length).fill(false);
    const talkbacks: TalkbackFn[] = new Array(sources.length).fill(talkbackPlaceholder);
    const buffer: unknown[] = new Array(sources.length).fill(undefined);

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
