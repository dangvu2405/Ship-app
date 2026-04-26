export interface BaseEntity {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
