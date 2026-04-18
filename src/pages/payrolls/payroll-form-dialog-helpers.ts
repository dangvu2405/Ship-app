import type { Payroll, PayrollDetail } from '@/types';

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function buildPayrollLineItems(payroll: Payroll | undefined): PayrollDetail[] {
  const rawLines = (payroll?.details ??
    (payroll as Payroll & { lines?: PayrollDetail[] | Record<string, unknown>[] } | undefined)?.lines ??
    []) as (PayrollDetail & Record<string, unknown>)[];
  return rawLines.map((line) => {
    const raw = line;
    return {
      ...raw,
      base_salary: toNumber(raw.base_salary),
      bonus: toNumber(raw.bonus ?? raw.trip_bonus),
      trip_bonus: toNumber(raw.trip_bonus),
      overtime: toNumber(raw.overtime),
      overtime_pay: toNumber(raw.overtime_pay),
      overtime_hours: toNumber(raw.overtime_hours),
      night_shift_allowance: toNumber(raw.night_shift_allowance),
      public_holiday_pay: toNumber(raw.public_holiday_pay),
      allowance: toNumber(raw.allowance),
      deduction: toNumber(raw.deduction),
      leave_unpaid_deduction: toNumber(raw.leave_unpaid_deduction),
      violation_deduction: toNumber(raw.violation_deduction),
      fuel_excess_deduction: toNumber(raw.fuel_excess_deduction ?? raw.fuel_cost),
      tax: toNumber(raw.tax),
      net_salary: toNumber(raw.net_salary),
      trips_completed_count: toNumber(raw.trips_completed_count),
      total_distance_km: toNumber(raw.total_distance_km),
      working_days: toNumber(raw.working_days),
      leave_days_paid: toNumber(raw.leave_days_paid),
      leave_days_unpaid: toNumber(raw.leave_days_unpaid),
      driver_id: raw.driver_id ? toNumber(raw.driver_id) : undefined,
      employee_id: raw.employee_id ? toNumber(raw.employee_id) : 0,
      driver: raw.driver as PayrollDetail['driver'],
      employee: raw.employee as PayrollDetail['employee'],
    };
  });
}

export type PayrollTotals = {
  total_base_salary: number;
  total_trip_bonus: number;
  total_overtime_pay: number;
  total_allowance: number;
  total_deduction: number;
  total_net_salary: number;
  total_trips_completed: number;
  total_distance_km: number;
};

export function computePayrollTotals(lineItems: PayrollDetail[]): PayrollTotals {
  return lineItems.reduce(
    (acc, line) => {
      const tripBonus = line.trip_bonus ?? line.bonus ?? 0;
      const overtimePay = line.overtime_pay ?? 0;
      const allowance = line.allowance ?? 0;
      const deductionTotal =
        (line.deduction ?? 0) +
        (line.leave_unpaid_deduction ?? 0) +
        (line.violation_deduction ?? 0) +
        (line.fuel_excess_deduction ?? 0) +
        (line.tax ?? 0);
      acc.total_base_salary += line.base_salary ?? 0;
      acc.total_trip_bonus += tripBonus;
      acc.total_overtime_pay += overtimePay;
      acc.total_allowance += allowance;
      acc.total_deduction += deductionTotal;
      acc.total_net_salary += line.net_salary ?? 0;
      acc.total_trips_completed += line.trips_completed_count ?? 0;
      acc.total_distance_km += line.total_distance_km ?? 0;
      return acc;
    },
    {
      total_base_salary: 0,
      total_trip_bonus: 0,
      total_overtime_pay: 0,
      total_allowance: 0,
      total_deduction: 0,
      total_net_salary: 0,
      total_trips_completed: 0,
      total_distance_km: 0,
    },
  );
}
