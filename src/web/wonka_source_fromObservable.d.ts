import { Source } from '../wonka_types';

export interface Subscription {
  unsubscribe(): void;
}

export interface Observer<T> {
  next(value: T): void;
  error(errorValue: any): void;
  complete(): void;
}

export interface Observable<T> {
  subscribe(observer: Observer<T>): Subscription;
}

export const fromObservable: <T>(observable: Observable<T>) => Source<T>;
