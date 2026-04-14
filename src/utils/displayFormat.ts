import dayjs from 'dayjs';

const DEFAULT_EMPTY = '-';

export const DEFAULT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  locked: 'Locked',
  generated: 'Generated',
  running: 'Running',
  pending: 'Pending',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  partial: 'Partial',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  resolved: 'Resolved',
  active: 'Active',
  inactive: 'Inactive',
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const formatMoney = (
  value: unknown,
  options?: {
    emptyValue?: string;
    currency?: string;
    withCurrency?: boolean;
  },
): string => {
  const emptyValue = options?.emptyValue ?? DEFAULT_EMPTY;
  const num = toNumber(value);
  if (num === null) return emptyValue;
  if (options?.withCurrency) {
    return num.toLocaleString('vi-VN', {
      style: 'currency',
      currency: options.currency ?? 'VND',
    });
  }
  return num.toLocaleString('vi-VN');
};

export const formatDecimal = (value: unknown, digits = 2, emptyValue = DEFAULT_EMPTY): string => {
  const num = toNumber(value);
  if (num === null) return emptyValue;
  return num.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
};

export const formatDate = (value: unknown, emptyValue = DEFAULT_EMPTY): string => {
  if (!value) return emptyValue;
  const parsed = dayjs(value as string | number | Date);
  if (!parsed.isValid()) return String(value);
  return parsed.format('DD/MM/YYYY');
};

export const formatDateTime = (value: unknown, emptyValue = DEFAULT_EMPTY): string => {
  if (!value) return emptyValue;
  const parsed = dayjs(value as string | number | Date);
  if (!parsed.isValid()) return String(value);
  return parsed.format('DD/MM/YYYY HH:mm');
};

export const formatStatusLabel = (
  value: unknown,
  labels: Record<string, string> = DEFAULT_STATUS_LABELS,
  emptyValue = DEFAULT_EMPTY,
): string => {
  if (!value) return emptyValue;
  const key = String(value).trim();
  if (!key) return emptyValue;
  return labels[key] || key;
};
