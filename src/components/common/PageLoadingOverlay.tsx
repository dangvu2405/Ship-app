import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { LottieTruckLoader } from '@/components/common/LottieTruckLoader';

type PageLoadingOverlayProps = {
  loading: boolean;
  children: ReactNode;
  className?: string;
  /** Vùng tối thiểu khi chưa có nội dung (tránh overlay cao 0). */
  minHeight?: string;
};

/**
 * Lớp mờ + Lottie xe tải trên một khối nội dung khi đang tải dữ liệu.
 */
export function PageLoadingOverlay({
  loading,
  children,
  className,
  minHeight = 'min-h-[280px]',
}: PageLoadingOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('relative', minHeight, className)} aria-busy={loading} aria-live="polite">
      <div className={cn('transition-opacity duration-200', loading && 'pointer-events-none opacity-40')}>
        {children}
      </div>
      {loading ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-background/55 backdrop-blur-sm dark:bg-background/60"
          role="status"
        >
          <LottieTruckLoader size={140} />
          <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
        </div>
      ) : null}
    </div>
  );
}
