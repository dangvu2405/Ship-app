export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | string>;
  meta?: {
    warnings?: string[];
    [key: string]: any;
  };
};
