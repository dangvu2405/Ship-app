/**
 * Chuẩn CSV xuất bảng lương (UTF-8 BOM để Excel nhận đúng tiếng Việt).
 * Hỗ trợ nhiều dạng envelope API: { data: { details: [] } }, { details: [] }, v.v.
 */

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function num(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? String(Math.round(n)) : String(v);
}

export type PayrollDetailExportRow = {
  payroll_id: string;
  company_id: string;
  month: string;
  year: string;
  employee_code: string;
  employee_name: string;
  base_salary: string;
  working_days: string;
  overtime: string;
  bonus: string;
  allowance: string;
  deduction: string;
  fuel_cost: string;
  tax: string;
  net_salary: string;
};

const HEADER: (keyof PayrollDetailExportRow)[] = [
  'payroll_id',
  'company_id',
  'month',
  'year',
  'employee_code',
  'employee_name',
  'base_salary',
  'working_days',
  'overtime',
  'bonus',
  'allowance',
  'deduction',
  'fuel_cost',
  'tax',
  'net_salary',
];

/** Trích payroll + chi tiết từ body JSON trả về từ GET export. */
export function parsePayrollExportPayload(payload: unknown): {
  payrollId: string;
  companyId: string;
  month: string;
  year: string;
  rows: PayrollDetailExportRow[];
} {
  let root = asRecord(payload);
  if (root && 'success' in root && root.data) {
    root = asRecord(root.data) ?? root;
  }

  const payrollId = num(root?.id);
  const companyId = num(root?.company_id);
  const month = num(root?.month);
  const year = num(root?.year);

  let details: unknown[] = [];
  if (Array.isArray(root?.details)) {
    details = root.details as unknown[];
  } else if (Array.isArray(root?.payroll_details)) {
    details = root.payroll_details as unknown[];
  } else if (Array.isArray(root?.items)) {
    details = root.items as unknown[];
  }

  const rows: PayrollDetailExportRow[] = details.map((item) => {
    const d = asRecord(item) ?? {};
    const emp = asRecord(d.employee);
    return {
      payroll_id: payrollId,
      company_id: companyId,
      month,
      year,
      employee_code: String(emp?.code ?? d.employee_code ?? ''),
      employee_name: String(emp?.name ?? d.employee_name ?? ''),
      base_salary: num(d.base_salary),
      working_days: num(d.working_days),
      overtime: num(d.overtime),
      bonus: num(d.bonus),
      allowance: num(d.allowance),
      deduction: num(d.deduction),
      fuel_cost: num(d.fuel_cost),
      tax: num(d.tax),
      net_salary: num(d.net_salary),
    };
  });

  return { payrollId, companyId, month, year, rows };
}

export function buildPayrollDetailCsv(payload: unknown): string {
  const { rows } = parsePayrollExportPayload(payload);
  const lines = [HEADER.join(',')];
  for (const row of rows) {
    lines.push(HEADER.map((key) => escapeCsvCell(row[key])).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}`;
}
