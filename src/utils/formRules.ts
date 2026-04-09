import type { Rule } from 'antd/es/form';

export type ValidationT = (key: string, options?: Record<string, string | number>) => string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function isValidYmd(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** HTML `type="date"` value (YYYY-MM-DD). */
export function ruleIsoDate(t: ValidationT, fieldLabel: string, required: boolean): Rule {
  return {
    validator: (_, value) => {
      const empty = value === undefined || value === null || String(value).trim() === '';
      if (empty) {
        return required
          ? Promise.reject(new Error(t('validation.required', { field: fieldLabel })))
          : Promise.resolve();
      }
      const s = String(value).trim();
      if (!ISO_DATE.test(s)) {
        return Promise.reject(new Error(t('validation.dateFormat')));
      }
      const y = Number(s.slice(0, 4));
      const m = Number(s.slice(5, 7));
      const d = Number(s.slice(8, 10));
      if (!isValidYmd(y, m, d)) {
        return Promise.reject(new Error(t('validation.dateInvalid')));
      }
      if (y < 1950 || y > 2100) {
        return Promise.reject(new Error(t('validation.dateYearRange')));
      }
      return Promise.resolve();
    },
  };
}

/** HTML `type="datetime-local"` (YYYY-MM-DDTHH:mm), optional. */
export function ruleDatetimeLocalOptional(t: ValidationT): Rule {
  return {
    validator: (_, value) => {
      if (value === undefined || value === null || String(value).trim() === '') {
        return Promise.resolve();
      }
      const s = String(value).trim();
      if (!DATETIME_LOCAL.test(s)) {
        return Promise.reject(new Error(t('validation.datetimeLocalFormat')));
      }
      const y = Number(s.slice(0, 4));
      const mo = Number(s.slice(5, 7));
      const d = Number(s.slice(8, 10));
      const hh = Number(s.slice(11, 13));
      const mm = Number(s.slice(14, 16));
      if (!isValidYmd(y, mo, d) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
        return Promise.reject(new Error(t('validation.dateInvalid')));
      }
      if (y < 1950 || y > 2100) {
        return Promise.reject(new Error(t('validation.dateYearRange')));
      }
      return Promise.resolve();
    },
  };
}

/** VND-style: non-negative integer, max ~ 1e15 đ. */
export function ruleVndNonNegative(t: ValidationT, fieldLabel: string, required: boolean): Rule {
  return {
    validator: (_, value) => {
      const empty = value === undefined || value === null || value === '';
      if (empty) {
        return required
          ? Promise.reject(new Error(t('validation.required', { field: fieldLabel })))
          : Promise.resolve();
      }
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) {
        return Promise.reject(new Error(t('validation.moneyNotNumber')));
      }
      if (!Number.isInteger(n)) {
        return Promise.reject(new Error(t('validation.moneyVndInteger')));
      }
      if (n < 0) {
        return Promise.reject(new Error(t('validation.moneyNonNegative')));
      }
      if (n > 1e15) {
        return Promise.reject(new Error(t('validation.moneyTooLarge')));
      }
      return Promise.resolve();
    },
  };
}

/** Strictly positive VND integer (e.g. chi phí xe). */
export function ruleVndPositive(t: ValidationT, fieldLabel: string): Rule {
  return {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error(t('validation.required', { field: fieldLabel })));
      }
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        return Promise.reject(new Error(t('validation.moneyVndInteger')));
      }
      if (n < 1) {
        return Promise.reject(new Error(t('validation.moneyPositiveMin')));
      }
      if (n > 1e15) {
        return Promise.reject(new Error(t('validation.moneyTooLarge')));
      }
      return Promise.resolve();
    },
  };
}

/** Khoảng cách / số thực dương (km), tối đa `max`. */
export function rulePositiveNumber(t: ValidationT, fieldLabel: string, required: boolean, max: number): Rule {
  return {
    validator: (_, value) => {
      const empty = value === undefined || value === null || value === '';
      if (empty) {
        return required
          ? Promise.reject(new Error(t('validation.required', { field: fieldLabel })))
          : Promise.resolve();
      }
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) {
        return Promise.reject(new Error(t('validation.moneyNotNumber')));
      }
      if (n < 0) {
        return Promise.reject(new Error(t('validation.moneyNonNegative')));
      }
      if (n > max) {
        return Promise.reject(new Error(t('validation.numberMax', { max })));
      }
      return Promise.resolve();
    },
  };
}

export function rulesDateRangeOrder(
  t: ValidationT,
  getStart: () => string | undefined,
  endLabel: string
): Rule {
  return {
    validator: (_, value) => {
      const end = value as string | undefined;
      const start = getStart();
      if (!start || !end) return Promise.resolve();
      if (end < start) {
        return Promise.reject(new Error(t('validation.endDateAfterStart', { field: endLabel })));
      }
      return Promise.resolve();
    },
  };
}
