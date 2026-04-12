export function createResourceQueryKeys(resource: string) {
  return {
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (params?: Record<string, unknown>) => [resource, 'list', params ?? {}] as const,
    details: () => [resource, 'detail'] as const,
    detail: (id: string | number) => [resource, 'detail', id] as const,
  };
}
