import type { ReactNode } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

type PageLoadingOverlayProps = {
  loading: boolean;
  children: ReactNode;
  className?: string;
  /** Vùng tối thiểu khi chưa có nội dung (tránh overlay cao 0). */
  minHeight?: string;
};

/**
 * Lớp mờ + spinner trên một khối nội dung (card / bảng) khi đang tải dữ liệu trang.
 */
export function PageLoadingOverlay({
  loading,
  children,
  className,
  minHeight = 'min-h-[280px]',
}: PageLoadingOverlayProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn('relative', minHeight, className)}
      aria-busy={loading}
      aria-live="polite"
    >
      <div
        className={cn(
          'transition-opacity duration-200',
          loading && 'pointer-events-none opacity-40',
        )}
      >
        {children}
      </div>
      {loading ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/55 backdrop-blur-sm dark:bg-background/60"
          role="status"
        >
          <Spin
            spinning
            indicator={
              <LoadingOutlined className="text-primary" style={{ fontSize: 32 }} spin aria-hidden />
            }
            tip={<span className="text-sm text-muted-foreground">{t('common.loading')}</span>}
          >
            <div className="h-10 w-10" aria-hidden />
          </Spin>
        </div>
      ) : null}
    </div>
  );
}
