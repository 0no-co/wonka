import { TalkbackFn, TeardownFn, Start, Push, SignalKind } from './types';

export const talkbackPlaceholder: TalkbackFn = _signal => {
  /*noop*/
};
export const teardownPlaceholder: TeardownFn = () => {
  /*noop*/
};

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
