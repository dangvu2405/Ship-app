export type PaginatedResponse<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type MetaResponse = {
  page?: number;
  per_page?: number;
  total?: number;
};
