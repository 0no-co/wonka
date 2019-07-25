import { Source } from '../wonka_types';

export interface JsSubscription {
  unsubscribe(): void;
}

export interface JsObserver<T> {
  next(value: T): void;
  error(errorValue: any): void;
  complete(): void;
}

export interface JsObservable<T> {
  subscribe(observer: JsObserver<T>): JsSubscription;
}

export const fromObservable: <T>(observable: JsObservable<T>) => Source<T>;
export const toObservable: <T>(source: Source<T>) => JsObservable<T>;
