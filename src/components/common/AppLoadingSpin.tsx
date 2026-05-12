import { Flex, Typography, theme } from 'antd';
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
  const { token } = theme.useToken();
  const isPage = variant === 'page';
  const isOutlet = variant === 'outlet';
  const isSection = variant === 'section';

  const lottieSize = isPage ? 200 : isOutlet ? 160 : 120;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: isPage ? '100vh' : isOutlet ? '50vh' : 320,
    background: isSection ? token.colorFillAlter : token.colorBgLayout,
    borderRadius: isSection || isOutlet ? token.borderRadiusLG : 0,
    border: isSection || isOutlet ? `1px solid ${token.colorBorderSecondary}` : undefined,
  };

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={containerStyle}
      className={className}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <Flex vertical align="center" gap={isPage ? 'middle' : 'small'} style={{ padding: token.paddingXL }}>
        <LottieTruckLoader size={lottieSize} />

        {isPage && (
          <Flex vertical align="center" gap="small" style={{ textAlign: 'center' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {t('common.pageLoading')}
            </Typography.Title>
            <Typography.Text type="secondary">
              {t('common.pageLoadingHint')}
            </Typography.Text>
          </Flex>
        )}

        {isOutlet && (
          <Typography.Text type="secondary" strong>
            {t('common.loading')}
          </Typography.Text>
        )}

        {isSection && (
          <Typography.Text type="secondary">
            {t('common.chartLoading')}
          </Typography.Text>
        )}
      </Flex>
    </Flex>
  );
}
