import type { ApiEnvelope, ApiListPayload, ApiPaginationMeta } from './types';

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

/**
 * Trả về `data` của envelope. Nếu input không phải envelope, trả nguyên giá trị.
 */
export function unwrapEnvelope<TData>(value: unknown): TData {
  throwIfEnvelopeFailed(value);
  if (isApiEnvelope<TData>(value)) {
    return value.data;
  }
  return value as TData;
}

/**
 * Helper cho list endpoint với envelope mới (`data: []`, `meta: {...}` ở root).
 *
 * Đồng thời chấp nhận envelope cũ kiểu `data: { data: [...], meta }` để service
 * legacy chưa migrate vẫn chạy.
 */
export function unwrapList<TItem>(value: unknown): ApiListPayload<TItem> {
  throwIfEnvelopeFailed(value);
  if (!isApiEnvelope<unknown>(value)) {
    if (Array.isArray(value)) return { data: value as TItem[] };
    return { data: [] };
  }
  const env = value as ApiEnvelope<unknown>;
  // New flat shape: data is array, meta sibling
  if (Array.isArray(env.data)) {
    return {
      data: env.data as TItem[],
      meta: (env.meta ?? undefined) as ApiPaginationMeta | undefined,
    };
  }
  // Legacy nested shape: data: { data: [...], meta }
  if (env.data && typeof env.data === 'object' && Array.isArray((env.data as { data?: unknown }).data)) {
    const nested = env.data as { data: TItem[]; meta?: ApiPaginationMeta };
    return { data: nested.data, meta: nested.meta };
  }
  return { data: [] };
}
