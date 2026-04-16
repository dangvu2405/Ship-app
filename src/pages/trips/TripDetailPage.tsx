import { ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Flex, Tag, Timeline, Typography } from 'antd';
import { useNavigation, useOne } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDateTime, formatMoney } from '@/utils/displayFormat';
import { getTripStatusLabel } from '@/utils/tripStatus';

function tripStatusColor(status?: string): string | undefined {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'processing';
    case 'cancelled':
      return 'error';
    default:
      return undefined;
  }
}

export function TripDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Trip>({
    resource: 'trips',
    id: resolvedId || '',
    queryOptions: { enabled: !!resolvedId },
  });

  const trip = data?.data;

  const timelineItems = [
    {
      content: `${t('common.create')}: ${formatDateTime(trip?.created_at)}`,
    },
    {
      content: `${t('trips.startTime')}: ${formatDateTime(trip?.start_time)}`,
      color: 'green' as const,
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
      content: `${t('trips.statusInProgress')}: ${getTripStatusLabel('in_progress', t)}`,
    },
    {
      color: 'red' as const,
      content: `${t('trips.endTime')}: ${formatDateTime(trip?.end_time)}`,
    },
    {
      content: `${t('trips.distance')}: ${trip?.distance_km ?? '-'} km`,
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
      content: `${t('trips.price')}: ${formatMoney(trip?.price, { withCurrency: true })}`,
    },
  ];

  return (
    <>
      <PageHeader
        title={`${t('common.view')} · ${t('trips.title')}`}
        description={trip?.code ?? t('common.loading')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('trips.title'), path: ROUTES.admin.trips.list },
          { label: t('common.view') },
        ]}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => list('trips')}>
            {t('common.back')}
          </Button>
        }
      />

      {isLoading || !trip ? (
        <TableSkeleton rows={8} columns={1} />
      ) : (
        <Flex vertical gap={12}>
          <Alert type="info" showIcon message={t('trips.description')} description={t('trips.editDescription')} />

          <Card>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label={t('trips.code')}>{trip.code}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag color={tripStatusColor(trip.status)}>{getTripStatusLabel(trip.status, t)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('trips.startPoint')}>{trip.start_point}</Descriptions.Item>
              <Descriptions.Item label={t('trips.endPoint')}>{trip.end_point}</Descriptions.Item>
              <Descriptions.Item label={t('trips.distance')}>{trip.distance_km} km</Descriptions.Item>
              <Descriptions.Item label={t('trips.price')}>
                {formatMoney(trip.price, { withCurrency: true })}
              </Descriptions.Item>
              <Descriptions.Item label={t('trips.startTime')}>{formatDateTime(trip.start_time)}</Descriptions.Item>
              <Descriptions.Item label={t('trips.endTime')}>{formatDateTime(trip.end_time)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t('common.history')}>
            <Timeline mode="alternate" items={timelineItems} />
            <Typography.Text type="secondary">{`${t('trips.tripCode')}: ${trip.code}`}</Typography.Text>
          </Card>
        </Flex>
      )}
    </>
  );
}
