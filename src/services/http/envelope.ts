import type { ApiEnvelope } from './types';

export function isApiEnvelope<TData>(value: unknown): value is ApiEnvelope<TData> {
  return Boolean(value && typeof value === 'object' && 'success' in value && 'data' in value);
}

export function throwIfEnvelopeFailed(value: unknown): void {
  if (value && typeof value === 'object' && 'success' in value && (value as { success?: boolean }).success === false) {
    const message = (value as { message?: string }).message || 'Request failed';
    const err = new Error(message) as Error & { response?: { data: unknown } };
    err.response = { data: value };
    throw err;
  }
}

export function unwrapEnvelope<TData>(value: unknown): TData {
  throwIfEnvelopeFailed(value);
  if (isApiEnvelope<TData>(value)) {
    return value.data;
  }
  return value as TData;
}
