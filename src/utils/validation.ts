import type { Rule } from 'antd/es/form';

const toLabel = (label?: string) => label || 'This field';

export const requiredRule = (label?: string): Rule => ({
  required: true,
  message: `${toLabel(label)} is required`,
});

export const nonNegativeNumberRule = (label?: string): Rule => ({
  validator: async (_, value: number | undefined) => {
    if (value == null) return;
    if (Number(value) < 0) {
      throw new Error(`${toLabel(label)} must be greater than or equal to 0`);
    }
  },
});

export const afterOrEqualDateRule = (
  getStartValue: () => unknown,
  startLabel: string,
  endLabel: string,
): Rule => ({
  validator: async (_, endValue: { isBefore?: (input: unknown, unit?: string) => boolean } | undefined) => {
    const startValue = getStartValue();
    if (!startValue || !endValue?.isBefore) return;
    if (endValue.isBefore(startValue, 'day')) {
      throw new Error(`${endLabel} must be after or equal to ${startLabel}`);
    }
  },
});

export const afterTimeRule = (
  getStartValue: () => unknown,
  startLabel: string,
  endLabel: string,
): Rule => ({
  validator: async (_, endValue: { isSameOrBefore?: (input: unknown, unit?: string) => boolean } | undefined) => {
    const startValue = getStartValue();
    if (!startValue || !endValue?.isSameOrBefore) return;
    if (endValue.isSameOrBefore(startValue, 'minute')) {
      throw new Error(`${endLabel} must be after ${startLabel}`);
    }
  },
});
