import type { MetaResponse } from '../domain/pagination';

export type CetaResourceListResponse = {
  data: unknown[];
  meta?: MetaResponse;
};

export type CetaResourceItemResponse = {
  data: unknown;
};

export type CetaRoute = {
  resource: string;
  id?: string | number;
  action?: string;
};
