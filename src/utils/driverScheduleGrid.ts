/** Monday-based week (VN): Monday = first column, Sunday = last. */
export function startOfWeekMonday(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type WeekDayColumn = {
  date: Date;
  iso: string;
  label: string;
};

export function buildWeekDayColumns(weekStartMonday: Date): WeekDayColumn[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartMonday, i);
    return {
      date,
      iso: toISODateString(date),
      label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });
}

export function cellKey(driverId: number, isoDate: string): string {
  return `${driverId}__${isoDate}`;
}
