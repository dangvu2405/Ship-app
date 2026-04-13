import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { LottieTruckLoader } from '@/components/common/LottieTruckLoader';

type AppLoadingSpinProps = {
  /**
   * `page` — full viewport (login, chunk độc lập);
   * `outlet` — vùng main trong AppLayout khi lazy route;
   * `section` — khối nhỏ (vd biểu đồ).
   */
  variant?: 'page' | 'outlet' | 'section';
  className?: string;
};

/**
 * Lottie xe tải theo theme — dùng làm Suspense fallback hoặc vùng đang tải.
 */
export function AppLoadingSpin({ variant = 'page', className }: AppLoadingSpinProps) {
  const { t } = useTranslation();
  const isPage = variant === 'page';
  const isOutlet = variant === 'outlet';

  const lottieSize = isPage ? 200 : isOutlet ? 160 : 120;

  const tip = isPage ? (
    <div className="mt-5 max-w-sm text-center">
      <p className="text-base font-semibold tracking-tight text-foreground">{t('common.pageLoading')}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('common.pageLoadingHint')}</p>
    </div>
  ) : isOutlet ? (
    <p className="mt-4 max-w-xs text-center text-sm font-medium text-muted-foreground">{t('common.loading')}</p>
  ) : (
    <span className="mt-3 block text-center text-sm font-medium text-muted-foreground">{t('common.chartLoading')}</span>
  );

  const content = (
    <div className="flex flex-col items-center">
      <LottieTruckLoader size={lottieSize} />
      {tip}
    </div>
  );

  if (variant === 'section') {
    return (
      <div
        className={cn(
          'flex h-[320px] w-full flex-col items-center justify-center rounded-xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/5',
          className,
        )}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {content}
      </div>
    );
  }

  if (isOutlet) {
    return (
      <div
        className={cn(
          'relative flex min-h-[50vh] w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-border/60',
          'bg-gradient-to-br from-slate-50/90 via-background to-sky-50/50',
          'dark:from-slate-950/90 dark:via-background dark:to-sky-950/30',
          className,
        )}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" aria-hidden />
        <div className="relative z-10 flex flex-col items-center px-6 py-16">{content}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-slate-50 via-background to-sky-50/80',
        'dark:from-slate-950 dark:via-background dark:to-sky-950/40',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.08),transparent_45%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" aria-hidden />
      <div className="relative z-10 flex flex-col items-center px-6 py-12">{content}</div>
    </div>
  );
}
