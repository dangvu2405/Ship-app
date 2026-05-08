import { useState } from 'react';
import { WarningOutlined, ArrowLeftOutlined, FileOutlined, AppstoreOutlined, EnvironmentOutlined, MoneyCollectOutlined, DollarOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Modal,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useNavigation, useOne, useInvalidate } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import type { Trip, TripStop } from '@/types';
import { ROUTES } from '@/routes';
import { formatDateTime, formatMoney } from '@/utils/displayFormat';
import {
  getAvailableActions,
  getTripStatusDisplay,
  TERMINAL_TRIP_STATUSES,
} from '@/utils/tripStatus';
import tripService from '@/services/trip.service';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { notifyErrorOnce } from '@/utils/errorToast';
import { userHasRole } from '@/utils/authPermissions';
import { StatusTimeline } from '@/pages/trips/components/StatusTimeline';
import { RevenueCard } from '@/pages/trips/components/RevenueCard';
import { TripCostsTab } from '@/pages/trips/components/TripCostsTab';

const REASON_ACTIONS = new Set(['cancel', 'emergency', 'delay']);

const TITLE_KEY_MAP: Record<string, string> = {
  cancel: 'trips.confirmCancelTitle',
  emergency: 'trips.confirmEmergencyTitle',
  delay: 'trips.confirmDelayTitle',
};

const REASON_KEY_MAP: Record<string, string> = {
  cancel: 'trips.cancelReason',
  emergency: 'trips.emergencyReason',
  delay: 'trips.delayReason',
};

export function TripDetailPage() {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const invalidate = useInvalidate();
  const { user } = useAuthStore();
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading, isError, error } = useOne<Trip>({
    resource: 'trips',
    id: resolvedId || '',
    queryOptions: { enabled: !!resolvedId, retry: false },
  });

  const trip = data?.data;
  const isAdmin = userHasRole(user, 'admin') || userHasRole(user, 'super_admin');
  const canDispatch = isAdmin || userHasRole(user, 'dispatcher') || userHasRole(user, 'manager');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [reasonModal, setReasonModal] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [reasonValue, setReasonValue] = useState('');

  const dispatchAction = async (action: string, reason?: string) => {
    if (!trip) return;
    setBusyAction(action);
    try {
      await tripService.dispatchAction(trip.id, action, { reason });
      feedback.success(t('notifications.updateSuccess', { item: t('trips.title') }));
      await invalidate({ resource: 'trips', invalidates: ['detail'], id: trip.id });
    } catch (error) {
      if (shouldShowLocalErrorToast(error)) {
        notifyErrorOnce('trip-action', error, {
          fallbackMessage: getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }),
        });
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleAction = (action: string) => {
    if (REASON_ACTIONS.has(action)) {
      setReasonValue('');
      setReasonModal({ open: true, action });
      return;
    }
    void dispatchAction(action);
  };

  const handleReasonConfirm = () => {
    const { action } = reasonModal;
    setReasonModal({ open: false, action: '' });
    void dispatchAction(action, reasonValue);
  };

  const availableActions = trip ? getAvailableActions(trip.status) : [];
  const isTerminal = trip ? TERMINAL_TRIP_STATUSES.includes(trip.status as never) : false;
  const tripStatusDisplay = trip ? getTripStatusDisplay(trip.status, t) : null;

  const driverLicenseExpired =
    trip?.driver?.expired_date != null &&
    trip.driver.expired_date !== '' &&
    dayjs(trip.driver.expired_date).isBefore(dayjs(), 'day');

  const stopsColumns = [
    { title: '#', dataIndex: 'sequence', key: 'sequence', width: 56 },
    { title: 'Loại', dataIndex: 'stop_type', key: 'stop_type', width: 100 },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <Tag>{s}</Tag>,
    },
    {
      title: 'Dự kiến',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      render: (v: string | null) => (v ? formatDateTime(v) : '—'),
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

      {isError ? (
        <ErrorState
          title="Không tìm thấy chuyến"
          description={getErrorMessage(error) || 'Chuyến này không tồn tại hoặc bạn không có quyền truy cập.'}
          onRetry={() => list('trips')}
        />
      ) : isLoading || !trip ? (
        <TableSkeleton rows={8} columns={1} />
      ) : (
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: <Space><AppstoreOutlined />{t('trips.tabInfo')}</Space>,
              children: (
                <Flex vertical gap={12}>
                  {canDispatch && !isTerminal && availableActions.length > 0 && (
                    <Card size="small">
                      <Flex gap={8} wrap="wrap" align="center">
                        <Typography.Text type="secondary" style={{ marginRight: 4 }}>
                          {t('common.actions')}:
                        </Typography.Text>
                        {availableActions.map((cfg) => (
                          <Button
                            key={cfg.action}
                            type={cfg.danger ? 'default' : 'primary'}
                            danger={cfg.danger}
                            size="small"
                            loading={busyAction === cfg.action}
                            disabled={busyAction !== null && busyAction !== cfg.action}
                            onClick={() => handleAction(cfg.action)}
                          >
                            {t(cfg.labelKey as Parameters<typeof t>[0])}
                          </Button>
                        ))}
                      </Flex>
                    </Card>
                  )}

                  {isTerminal && tripStatusDisplay && (
                    <Alert type={trip.status === 'completed' ? 'success' : 'warning'} showIcon message={tripStatusDisplay.label} />
                  )}

                  <Card>
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label={t('trips.code')}>{trip.code}</Descriptions.Item>
                      <Descriptions.Item label={t('common.status')}>
                        {tripStatusDisplay && <Tag color={tripStatusDisplay.color}>{tripStatusDisplay.label}</Tag>}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('trips.startPoint')}>{trip.start_point}</Descriptions.Item>
                      <Descriptions.Item label={t('trips.endPoint')}>{trip.end_point}</Descriptions.Item>
                      <Descriptions.Item label={t('trips.distance')}>{trip.distance_km} km</Descriptions.Item>
                      <Descriptions.Item label={t('trips.price')}>
                        {formatMoney(trip.price, { withCurrency: true })}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('trips.startTime')}>{formatDateTime(trip.start_time)}</Descriptions.Item>
                      <Descriptions.Item label={t('trips.endTime')}>{formatDateTime(trip.end_time)}</Descriptions.Item>
                      {trip.customer && (
                        <Descriptions.Item label={t('invoices.customer')} span={2}>
                          {trip.customer.name}
                        </Descriptions.Item>
                      )}
                      {trip.driver && (
                        <Descriptions.Item label={t('drivers.title')} span={2}>
                          <Space>
                            {driverLicenseExpired ? (
                              <Tooltip title="GPLX tài xế đã hết hạn (R03)">
                                <WarningOutlined className="text-amber-500" />
                              </Tooltip>
                            ) : null}
                            <span>{trip.driver.name}</span>
                            {trip.driver.code ? (
                              <Typography.Text type="secondary">({trip.driver.code})</Typography.Text>
                            ) : null}
                          </Space>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>

                  <Card title={t('trips.statusTimeline')}>
                    <StatusTimeline histories={trip.trip_status_histories} />
                  </Card>
                </Flex>
              ),
            },
            {
              key: 'stops',
              label: <Space><EnvironmentOutlined />Điểm dừng</Space>,
              children: (
                <Card>
                  {(trip.trip_stops?.length ?? 0) === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có điểm dừng bổ sung" />
                  ) : (
                    <Table<TripStop>
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={trip.trip_stops}
                      columns={stopsColumns}
                      scroll={{ x: 'max-content' }}
                    />
                  )}
                </Card>
              ),
            },
            {
              key: 'surcharges',
              label: <Space><DollarOutlined />Doanh thu & phụ phí</Space>,
              children: <RevenueCard trip={trip} />,
            },
            {
              key: 'costs',
              label: <Space><MoneyCollectOutlined />{t('trips.tabCosts')}</Space>,
              children: <TripCostsTab tripId={trip.id} />,
            },
            {
              key: 'documents',
              label: <Space><FileOutlined />Chứng từ</Space>,
              children: (
                <Card>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Tab chứng từ sẽ kết nối tới /api/trips/{id}/documents khi backend bật endpoint"
                  />
                </Card>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={reasonModal.open}
        title={reasonModal.action ? t(TITLE_KEY_MAP[reasonModal.action] as Parameters<typeof t>[0]) : ''}
        okButtonProps={{
          danger: true,
          disabled: reasonModal.action !== 'delay' && !reasonValue.trim(),
          loading: busyAction === reasonModal.action,
        }}
        onOk={handleReasonConfirm}
        onCancel={() => setReasonModal({ open: false, action: '' })}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {reasonModal.action === 'cancel' && (
            <Alert type="warning" showIcon message={t('trips.cancelReasonRequiredHint')} />
          )}
          {reasonModal.action === 'emergency' && (
            <Alert type="error" showIcon message={t('trips.confirmEmergencyTitle')} />
          )}
          <Input.TextArea
            rows={3}
            placeholder={reasonModal.action ? t(REASON_KEY_MAP[reasonModal.action] as Parameters<typeof t>[0]) : ''}
            value={reasonValue}
            onChange={(e) => setReasonValue(e.target.value)}
          />
        </Space>
      </Modal>
    </>
  );
}
