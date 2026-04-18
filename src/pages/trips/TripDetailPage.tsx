import { useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Modal,
  Input,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useNavigation, useOne, useInvalidate } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDateTime, formatMoney } from '@/utils/displayFormat';
import {
  getAvailableActions,
  getTripStatusLabel,
  getTripStatusTagColor,
  TERMINAL_TRIP_STATUSES,
} from '@/utils/tripStatus';
import tripService from '@/services/trip.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { notifyErrorOnce } from '@/utils/errorToast';

const REASON_ACTIONS = new Set(['cancel', 'emergency', 'delay']);

const TITLE_KEY_MAP: Record<string, string> = {
  cancel:    'trips.confirmCancelTitle',
  emergency: 'trips.confirmEmergencyTitle',
  delay:     'trips.confirmDelayTitle',
};

const REASON_KEY_MAP: Record<string, string> = {
  cancel:    'trips.cancelReason',
  emergency: 'trips.emergencyReason',
  delay:     'trips.delayReason',
};

export function TripDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const invalidate = useInvalidate();
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Trip>({
    resource: 'trips',
    id: resolvedId || '',
    queryOptions: { enabled: !!resolvedId },
  });

  const trip = data?.data;
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [reasonModal, setReasonModal] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [reasonValue, setReasonValue] = useState('');

  const dispatchAction = async (action: string, reason?: string) => {
    if (!trip) return;
    setBusyAction(action);
    try {
      await tripService.dispatchAction(trip.id, action, { reason });
      toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
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

  const timelineItems = trip
    ? [
        { color: 'gray',  children: `${t('common.create')}: ${formatDateTime(trip.created_at)}` },
        ...(trip.start_time
          ? [{ color: 'blue', children: `${t('trips.startTime')}: ${formatDateTime(trip.start_time)}` }]
          : []),
        ...(trip.end_time
          ? [{ color: 'green', children: `${t('trips.endTime')}: ${formatDateTime(trip.end_time)}` }]
          : []),
        {
          color: TERMINAL_TRIP_STATUSES.includes(trip.status as never) ? 'green' : 'blue',
          children: (
            <Flex gap={8} align="center">
              <Typography.Text>{t('common.status')}:</Typography.Text>
              <Tag color={getTripStatusTagColor(trip.status)}>{getTripStatusLabel(trip.status, t)}</Tag>
            </Flex>
          ),
        },
      ]
    : [];

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
          {/* Action panel */}
          {!isTerminal && availableActions.length > 0 && (
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

          {isTerminal && (
            <Alert
              type={trip.status === 'completed' ? 'success' : 'warning'}
              showIcon
              message={getTripStatusLabel(trip.status, t)}
            />
          )}

          {/* Main info */}
          <Card>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label={t('trips.code')}>{trip.code}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag color={getTripStatusTagColor(trip.status)}>{getTripStatusLabel(trip.status, t)}</Tag>
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
            </Descriptions>
          </Card>

          {/* Timeline */}
          <Card title={t('trips.statusTimeline')}>
            <Timeline mode="left" items={timelineItems} />
          </Card>
        </Flex>
      )}

      {/* Reason modal (cancel / delay / emergency) */}
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
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {reasonModal.action === 'cancel' && (
            <Alert type="warning" showIcon message={t('trips.confirmCancelTitle')} />
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
