/**
 * Tính toán lương theo quy định pháp luật VN 2024.
 *
 * Tỷ lệ BHXH/BHYT/BHTN áp dụng từ 01/01/2024:
 *   - NLĐ:   BHXH 8% + BHYT 1.5% + BHTN 1%       = 10.5%
 *   - NSDLĐ: BHXH 17.5% + BHYT 3% + BHTN 1% + BHTNLĐ-BNN 0.5% = 22%
 *
 * Lương cơ sở từ 01/07/2024: 2,340,000 VND/tháng
 * Trần đóng BHXH: 20 × lương cơ sở = 46,800,000 VND/tháng
 * Trần đóng BHYT: 20 × lương cơ sở (giống BHXH)
 * Trần đóng BHTN: 20 × lương tối thiểu vùng (vùng I: 4,960,000 → 99,200,000, không thực tế cap ở mức thông thường)
 *
 * Giảm trừ gia cảnh PIT (Điều 9 Luật Thuế TNCN):
 *   - Bản thân: 11,000,000 VND/tháng
 *   - Người phụ thuộc: 4,400,000 VND/người/tháng
 *
 * Biểu thuế TNCN lũy tiến từng phần (Bảng 2 Phụ lục II TT111/2013):
 *   Bậc 1: ≤ 5,000,000          → 5%
 *   Bậc 2: 5,000,001 – 10,000,000  → 10%
 *   Bậc 3: 10,000,001 – 18,000,000 → 15%
 *   Bậc 4: 18,000,001 – 32,000,000 → 20%
 *   Bậc 5: 32,000,001 – 52,000,000 → 25%
 *   Bậc 6: 52,000,001 – 80,000,000 → 30%
 *   Bậc 7: > 80,000,000            → 35%
 */

/** Tỷ lệ đóng BHXH/BHYT/BHTN (phần trăm). */
export const VN_SI_RATES = {
  employee: {
    bhxh: 0.08,
    bhyt: 0.015,
    bhtn: 0.01,
    total: 0.105,
  },
  employer: {
    bhxh: 0.175,
    bhyt: 0.03,
    bhtn: 0.01,
    bhtnld_bnn: 0.005,
    total: 0.22,
  },
} as const;

/** Lương cơ sở từ 01/07/2024 (đồng/tháng). */
export const BASE_SALARY_2024 = 2_340_000;

/** Trần đóng BHXH/BHYT = 20 × lương cơ sở. */
export const SI_SALARY_CAP = 20 * BASE_SALARY_2024; // 46,800,000

/** Giảm trừ gia cảnh bản thân (đồng/tháng). */
export const PERSONAL_DEDUCTION = 11_000_000;

/** Giảm trừ mỗi người phụ thuộc (đồng/tháng). */
export const DEPENDANT_DEDUCTION = 4_400_000;

/** Biểu thuế TNCN lũy tiến [upper_limit, rate]. upper_limit = Infinity cho bậc 7. */
const PIT_BRACKETS: [number, number][] = [
  [5_000_000,   0.05],
  [10_000_000,  0.10],
  [18_000_000,  0.15],
  [32_000_000,  0.20],
  [52_000_000,  0.25],
  [80_000_000,  0.30],
  [Infinity,    0.35],
];

export interface SIBreakdown {
  /** Lương làm căn cứ đóng BHXH (tối đa = SI_SALARY_CAP). */
  siSalaryBase: number;
  /** BHXH phần NLĐ đóng. */
  bhxhEmployee: number;
  /** BHYT phần NLĐ đóng. */
  bhytEmployee: number;
  /** BHTN phần NLĐ đóng. */
  bhtnEmployee: number;
  /** Tổng BHXH+BHYT+BHTN phần NLĐ. */
  totalSIEmployee: number;
  /** BHXH phần NSDLĐ đóng (không trừ vào lương NV). */
  bhxhEmployer: number;
  /** BHYT phần NSDLĐ đóng. */
  bhytEmployer: number;
  /** BHTN phần NSDLĐ đóng. */
  bhtnEmployer: number;
  /** BHTNLĐ-BNN phần NSDLĐ đóng. */
  bhtnldBnnEmployer: number;
  /** Tổng chi phí BHXH phần NSDLĐ. */
  totalSIEmployer: number;
}

export interface PITBreakdown {
  /** Thu nhập chịu thuế (gross - SI employee - giảm trừ gia cảnh). */
  taxableIncome: number;
  /** Giảm trừ bản thân. */
  personalDeduction: number;
  /** Giảm trừ người phụ thuộc. */
  dependantDeductionTotal: number;
  /** Số người phụ thuộc. */
  dependants: number;
  /** Thu nhập tính thuế (sau giảm trừ gia cảnh). */
  assessableIncome: number;
  /** Thuế TNCN từng bậc: [bậc, thu_nhập_bậc, thuế]. */
  brackets: { level: number; incomeInBracket: number; rate: number; tax: number }[];
  /** Tổng thuế TNCN (làm tròn). */
  totalPIT: number;
}

export interface PayrollCalcResult {
  grossSalary: number;
  si: SIBreakdown;
  pit: PITBreakdown;
  /** Lương net = gross - SI employee - PIT. */
  netSalary: number;
  /** Tổng chi phí thực tế công ty = gross + SI employer. */
  totalEmployerCost: number;
}

/** Tính phân tách BHXH/BHYT/BHTN cho một nhân viên trong một tháng. */
export function calcSI(grossSalary: number): SIBreakdown {
  const siBase = Math.min(grossSalary, SI_SALARY_CAP);

  const bhxhEmployee   = Math.round(siBase * VN_SI_RATES.employee.bhxh);
  const bhytEmployee   = Math.round(siBase * VN_SI_RATES.employee.bhyt);
  const bhtnEmployee   = Math.round(siBase * VN_SI_RATES.employee.bhtn);
  const totalSIEmployee = bhxhEmployee + bhytEmployee + bhtnEmployee;

  const bhxhEmployer      = Math.round(siBase * VN_SI_RATES.employer.bhxh);
  const bhytEmployer      = Math.round(siBase * VN_SI_RATES.employer.bhyt);
  const bhtnEmployer      = Math.round(siBase * VN_SI_RATES.employer.bhtn);
  const bhtnldBnnEmployer = Math.round(siBase * VN_SI_RATES.employer.bhtnld_bnn);
  const totalSIEmployer   = bhxhEmployer + bhytEmployer + bhtnEmployer + bhtnldBnnEmployer;

  return {
    siSalaryBase: siBase,
    bhxhEmployee, bhytEmployee, bhtnEmployee, totalSIEmployee,
    bhxhEmployer, bhytEmployer, bhtnEmployer, bhtnldBnnEmployer, totalSIEmployer,
  };
}

/** Tính thuế TNCN theo phương pháp lũy tiến từng phần. */
export function calcPIT(grossSalary: number, siEmployee: number, dependants = 0): PITBreakdown {
  const personalDeduction        = PERSONAL_DEDUCTION;
  const dependantDeductionTotal  = dependants * DEPENDANT_DEDUCTION;
  const taxableIncome            = Math.max(0, grossSalary - siEmployee);
  const assessableIncome         = Math.max(0, taxableIncome - personalDeduction - dependantDeductionTotal);

  let remaining = assessableIncome;
  let prevLimit = 0;
  let totalPIT  = 0;
  const brackets: PITBreakdown['brackets'] = [];

  PIT_BRACKETS.forEach(([upperLimit, rate], index) => {
    const bracketWidth = upperLimit === Infinity ? remaining : upperLimit - prevLimit;
    const incomeInBracket = Math.min(remaining, bracketWidth);
    const tax = Math.round(incomeInBracket * rate);
    brackets.push({ level: index + 1, incomeInBracket, rate, tax });
    totalPIT += tax;
    remaining -= incomeInBracket;
    prevLimit = upperLimit === Infinity ? prevLimit : upperLimit;
    if (remaining <= 0) return;
  });

  return {
    taxableIncome,
    personalDeduction,
    dependantDeductionTotal,
    dependants,
    assessableIncome,
    brackets,
    totalPIT,
  };
}

/** Tính đầy đủ lương từ gross. */
export function calcPayroll(grossSalary: number, dependants = 0): PayrollCalcResult {
  const si  = calcSI(grossSalary);
  const pit = calcPIT(grossSalary, si.totalSIEmployee, dependants);
  const netSalary        = Math.max(0, grossSalary - si.totalSIEmployee - pit.totalPIT);
  const totalEmployerCost = grossSalary + si.totalSIEmployer;

  return { grossSalary, si, pit, netSalary, totalEmployerCost };
}

/** Tính gross từ net (xấp xỉ bằng binary search). Dùng cho reverse lookup. */
export function grossFromNet(targetNet: number, dependants = 0, iterations = 50): number {
  let lo = targetNet;
  let hi = targetNet * 2;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const { netSalary } = calcPayroll(mid, dependants);
    if (netSalary < targetNet) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}

/** Format số tiền VND (không dùng i18n — pure util). */
export function fmtVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
