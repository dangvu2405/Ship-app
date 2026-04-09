import type { Translate } from '@/hooks/useTranslation';

/** Trip workflow status labels (lists, dashboard widgets). */
export function getTripStatusLabel(status: string, t: Translate): string {
  switch (status) {
    case 'completed':
      return t('trips.statusCompleted');
    case 'in_progress':
      return t('trips.statusInProgress');
    case 'cancelled':
      return t('trips.statusCancelled');
    default:
      return t('trips.statusPending');
  }
}
