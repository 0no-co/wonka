import { TalkbackFn, TeardownFn, Start, Push, SignalKind } from './types';

export const teardownPlaceholder: TeardownFn = () => {
  /*noop*/
};
export const talkbackPlaceholder: TalkbackFn = teardownPlaceholder;

export function start<T>(talkback: TalkbackFn): Start<T> {
  const box: any = [talkback];
  box.tag = SignalKind.Start;
  return box;
}

export function push<T>(value: T): Push<T> {
  const box: any = [value];
  box.tag = SignalKind.Push;
  return box;
}
