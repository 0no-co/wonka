import { Source } from '../wonka_types';

export const fromDomEvent: <E>(element: HTMLElement, event: string) => Source<E>;
