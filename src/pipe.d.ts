import { Source } from './wonka_types';

interface UnaryFn<T, R> { (source: T): R; }

/* pipe definitions for source + operators composition */

export function pipe<T, A>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>
): Source<A>;

export function pipe<T, A, B>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>
): Source<B>;

export function pipe<T, A, B, C>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>
): Source<C>;

export function pipe<T, A, B, C, D>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>
): Source<D>;

export function pipe<T, A, B, C, D, E>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>
): Source<E>;

export function pipe<T, A, B, C, D, E, F>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  op6: UnaryFn<Source<E>, Source<F>>
): Source<F>;

export function pipe<T, A, B, C, D, E, F, G>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  op6: UnaryFn<Source<E>, Source<F>>,
  op7: UnaryFn<Source<F>, Source<G>>
): Source<G>;

export function pipe<T, A, B, C, D, E, F, G, H>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  op6: UnaryFn<Source<E>, Source<F>>,
  op7: UnaryFn<Source<F>, Source<G>>,
  op8: UnaryFn<Source<G>, Source<H>>
): Source<H>;

/* pipe definitions for source + operators + consumer composition */

export function pipe<T, R>(
  source: Source<T>,
  consumer: UnaryFn<Source<T>, R>
): R;

export function pipe<T, A, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  consumer: UnaryFn<Source<A>, R>
): R;

export function pipe<T, A, B, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  consumer: UnaryFn<Source<B>, R>
): R;

export function pipe<T, A, B, C, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  consumer: UnaryFn<Source<C>, R>
): R;

export function pipe<T, A, B, C, D, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  consumer: UnaryFn<Source<D>, R>
): R;

export function pipe<T, A, B, C, D, E, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  consumer: UnaryFn<Source<E>, R>
): R;

export function pipe<T, A, B, C, D, E, F, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  op6: UnaryFn<Source<E>, Source<F>>,
  consumer: UnaryFn<Source<F>, R>
): R;

export function pipe<T, A, B, C, D, E, F, G, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  op6: UnaryFn<Source<E>, Source<F>>,
  op7: UnaryFn<Source<F>, Source<G>>,
  consumer: UnaryFn<Source<G>, R>
): R;

export function pipe<T, A, B, C, D, E, F, G, H, R>(
  source: Source<T>,
  op1: UnaryFn<Source<T>, Source<A>>,
  op2: UnaryFn<Source<A>, Source<B>>,
  op3: UnaryFn<Source<B>, Source<C>>,
  op4: UnaryFn<Source<C>, Source<D>>,
  op5: UnaryFn<Source<D>, Source<E>>,
  op6: UnaryFn<Source<E>, Source<F>>,
  op7: UnaryFn<Source<F>, Source<G>>,
  op8: UnaryFn<Source<G>, Source<H>>,
  consumer: UnaryFn<Source<H>, R>
): R;
