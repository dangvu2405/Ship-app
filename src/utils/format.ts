const CURRENCY_FORMATTER_VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const DATE_FORMATTER_VN = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DATETIME_FORMATTER_VN = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function parseDateInput(value: string): Date | null {
  if (!value) return null;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrencyVND(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '—';
  return CURRENCY_FORMATTER_VND.format(amount);
}

export function formatDateVN(value?: string | null): string {
  if (!value) return '—';
  const parsed = parseDateInput(value);
  if (!parsed) return value;
  return DATE_FORMATTER_VN.format(parsed);
}

export function formatDateTimeVN(value?: string | null): string {
  if (!value) return '—';
  const parsed = parseDateInput(value);
  if (!parsed) return value;
  return DATETIME_FORMATTER_VN.format(parsed);
}
