import { useMemo } from 'react';
import type { CostCategory } from '@/types/domain/cost';

export interface CostValidationState {
  exceedsThreshold: boolean;
  threshold: number | null;
  requiresReceipt: boolean;
  receiptMissing: boolean;
  willRequireApproval: boolean;
}

function isTruthyReceiptFlag(v: number | boolean | undefined): boolean {
  return v === true || v === 1;
}

/**
 * R06: so sánh amount với approval_threshold; requires_receipt bắt buộc chứng từ.
 */
export function useCostValidation(
  category: CostCategory | null | undefined,
  amount: number | null | undefined,
  hasReceipt: boolean,
): CostValidationState {
  return useMemo(() => {
    const threshold = category?.approval_threshold ?? null;
    const amt = amount != null && Number.isFinite(amount) ? amount : null;
    const exceedsThreshold = threshold != null && amt != null && amt > threshold;
    const requiresReceipt = isTruthyReceiptFlag(category?.requires_receipt);
    const receiptMissing = requiresReceipt && !hasReceipt;
    const willRequireApproval = exceedsThreshold;

    return {
      exceedsThreshold,
      threshold,
      requiresReceipt,
      receiptMissing,
      willRequireApproval,
    };
  }, [category, amount, hasReceipt]);
}

export function validateCostBeforeSubmit(state: CostValidationState): string | null {
  if (state.receiptMissing) {
    return 'costManagement.receiptRequired';
  }
  return null;
}
