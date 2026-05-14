export function createResourceQueryKeys(resource: string) {
  return {
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (params?: Record<string, unknown>) => {
      const sorted = params
        ? Object.fromEntries(Object.keys(params).sort().map((k) => [k, params[k]]))
        : {};
      return [resource, 'list', sorted] as const;
    },
    details: () => [resource, 'detail'] as const,
    detail: (id: string | number) => [resource, 'detail', id] as const,
  };
}
