import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Thời gian tối thiểu hiển thị spinner Suspense (ms), song song với import. */
export const LAZY_ROUTE_SPIN_MIN_MS = 1000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Giống `React.lazy` nhưng đợi tối thiểu `minMs` (mặc định 1s) để tránh spinner nháy quá nhanh.
 *
 * `ComponentType<any>` khớp cách `React.lazy` gõ kiểu upstream: route chunk có default export với props khác nhau.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous default exports (pages, charts); stricter bound breaks inference (e.g. Dashboard chart).
export function lazyWithMinDelay<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>,
  minMs: number = LAZY_ROUTE_SPIN_MIN_MS,
): LazyExoticComponent<T> {
  return lazy(() => Promise.all([load(), delay(minMs)]).then(([mod]) => mod));
}
