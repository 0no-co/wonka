import { talkbackPlaceholder } from './Wonka_helpers.bs';

import {
  talkbackT,
  signalT
} from '../Wonka_types.gen';

type talkbackCb = (tb: talkbackT) => void;

export const pull: talkbackT = 0;
export const close: talkbackT = 1;

export const start = <a>(tb: talkbackCb): signalT<a> => ({TAG: 0, "_0": tb});
export const push = <a>(x: a): signalT<a> => ({TAG: 1, "_0": x});
export const end = <a>(): signalT<a> => 0;

export const isStart = <a>(s: signalT<a>) =>
  typeof s !== 'number' && s.TAG === 0;
export const isPush = <a>(s: signalT<a>) =>
  typeof s !== 'number' && s.TAG === 1;
export const isEnd = <a>(s: signalT<a>) =>
  typeof s === 'number' && s === 0;

export const unboxPush = <a>(s: signalT<a>): a | null =>
  isPush(s) ? s["_0"] : null;
export const unboxStart = <a>(s: signalT<a>): talkbackCb =>
  isStart(s) ? s["_0"] : (talkbackPlaceholder as any);
