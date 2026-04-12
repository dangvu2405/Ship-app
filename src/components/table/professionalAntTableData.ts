import type { Key } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import type { DemoOrderStatus, ProfessionalOrderRow } from './professionalAntTableTypes';

dayjs.locale('vi');

export const STATUS_META: Record<DemoOrderStatus, { label: string; color: 'gold' | 'processing' | 'success' | 'error' }> = {
  pending: { label: 'Chờ xử lý', color: 'gold' },
  processing: { label: 'Đang xử lý', color: 'processing' },
  completed: { label: 'Hoàn thành', color: 'success' },
  cancelled: { label: 'Đã hủy', color: 'error' },
};

export function matchesTextFilter(value: boolean | Key, record: ProfessionalOrderRow, field: keyof ProfessionalOrderRow) {
  if (value === false || value === true || value === undefined || value === '') return true;
  const raw = record[field];
  const haystack = raw === undefined || raw === null ? '' : String(raw);
  return haystack.toLowerCase().includes(String(value).toLowerCase().trim());
}

/** Dữ liệu mẫu — thay bằng API thật khi tích hợp */
export const PROFESSIONAL_TABLE_SAMPLE_DATA: ProfessionalOrderRow[] = [
  {
    key: '1',
    id: 1001,
    orderCode: 'DH-2024-001',
    customerName: 'Công ty TNHH ABC',
    status: 'completed',
    amount: 15_500_000,
    createdAt: '2024-06-12T09:30:00',
    note: 'Giao hàng trong giờ hành chính',
  },
  {
    key: '2',
    id: 1002,
    orderCode: 'DH-2024-002',
    customerName: 'Siêu thị XYZ',
    status: 'processing',
    amount: 8_200_000,
    createdAt: '2024-06-13T14:15:00',
  },
  {
    key: '3',
    id: 1003,
    orderCode: 'DH-2024-003',
    customerName: 'Công ty ABC',
    status: 'pending',
    amount: 3_450_000,
    createdAt: '2024-06-14T08:00:00',
    note: 'Ưu tiên xuất VAT',
  },
  {
    key: '4',
    id: 1004,
    orderCode: 'DH-2024-004',
    customerName: 'Kho miền Nam',
    status: 'cancelled',
    amount: 0,
    createdAt: '2024-06-14T16:45:00',
  },
];
