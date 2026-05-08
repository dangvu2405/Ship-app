import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  theme,
  Typography,
} from 'antd';
import { CheckOutlined, FileTextOutlined, LockOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { useCustomerList } from '@/hooks/useCustomers';
import reconciliationService, {
  type ReconciliationItem,
  type ReconciliationSession,
} from '@/services/reconciliation.service';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errorHandler';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const STATUS_LABEL: Record<string, { color: string; label: string }> = {
  draft: { color: 'orange', label: 'Bản nháp' },
  confirmed: { color: 'blue', label: 'Đã xác nhận' },
  locked: { color: 'red', label: 'Đã khóa' },
};

export function ReconciliationPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<ReconciliationSession | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createCustomerId, setCreateCustomerId] = useState<number | undefined>(undefined);
  const [createPeriod, setCreatePeriod] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [createNotes, setCreateNotes] = useState('');

  const { data: customersData } = useCustomerList({ current: 1, pageSize: 200 });
  const customerOptions = useMemo(
    () => (customersData ?? []).map((c) => ({ value: c.id, label: c.name })),
    [customersData],
  );

  const sessionsQuery = useQuery({
    queryKey: ['reconciliations', { selectedCustomerId, statusFilter }] as const,
    queryFn: async () => {
      try {
        const res = await reconciliationService.list({
          customer_id: selectedCustomerId,
          status: statusFilter,
          page: 1,
          per_page: 50,
        });
        const payload = (res?.data as unknown as { data?: ReconciliationSession[] } | ReconciliationSession[] | undefined) ?? [];
        return Array.isArray(payload) ? payload : payload.data ?? [];
      } catch {
        return [] as ReconciliationSession[];
      }
    },
  });
  const sessions = sessionsQuery.data ?? [];

  const itemsQuery = useQuery({
    queryKey: ['reconciliations', activeSession?.id, 'items'] as const,
    queryFn: async () => {
      if (!activeSession?.id) return [] as ReconciliationItem[];
      try {
        const res = await reconciliationService.getItems(activeSession.id);
        const payload = (res?.data as unknown as { data?: ReconciliationItem[] } | ReconciliationItem[] | undefined) ?? [];
        return Array.isArray(payload) ? payload : payload.data ?? [];
      } catch {
        return [] as ReconciliationItem[];
      }
    },
    enabled: !!activeSession?.id,
  });
  const items = itemsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!createCustomerId) throw new Error('Vui lòng chọn khách hàng');
      return reconciliationService.create({
        customer_id: createCustomerId,
        period_from: createPeriod[0].format('YYYY-MM-DD'),
        period_to: createPeriod[1].format('YYYY-MM-DD'),
        notes: createNotes || undefined,
      });
    },
    onSuccess: (res) => {
      const session = res.data as ReconciliationSession | undefined;
      message.success('Đã tạo phiên đối soát');
      setCreateOpen(false);
      setCreateNotes('');
      void queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      if (session) setActiveSession(session);
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, amount }: { itemId: number; amount: number }) => {
      if (!activeSession?.id) throw new Error('Phiên không hợp lệ');
      return reconciliationService.updateItem(activeSession.id, itemId, { adjusted_amount: amount });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reconciliations', activeSession?.id, 'items'] });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.id) throw new Error('Phiên không hợp lệ');
      return reconciliationService.confirm(activeSession.id);
    },
    onSuccess: (res) => {
      message.success('Đã xác nhận phiên đối soát');
      const updated = res.data as ReconciliationSession | undefined;
      if (updated) setActiveSession(updated);
      void queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.id) throw new Error('Phiên không hợp lệ');
      return reconciliationService.lock(activeSession.id);
    },
    onSuccess: (res) => {
      message.success('Đã khóa phiên đối soát');
      const updated = res.data as ReconciliationSession | undefined;
      if (updated) setActiveSession(updated);
      void queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  useEffect(() => {
    if (!activeSession) return;
    const fresh = sessions.find((s) => s.id === activeSession.id);
    if (fresh && fresh.status !== activeSession.status) {
      setActiveSession(fresh);
    }
  }, [sessions, activeSession]);

  const totalOriginal = items.reduce((sum, i) => sum + (i.original_amount ?? 0), 0);
  const totalAdjusted = items.reduce(
    (sum, i) => sum + (i.adjusted_amount ?? i.original_amount ?? 0),
    0,
  );
  const totalAdjustment = totalAdjusted - totalOriginal;
  const isLocked = activeSession?.status === 'locked';
  const isConfirmed = activeSession?.status === 'confirmed';

  return (
    <div>
      <PageHeader
        title={t('accountingPages.reconciliationTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.reconciliationTitle') },
        ]}
        actions={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void sessionsQuery.refetch();
                if (activeSession?.id) void itemsQuery.refetch();
              }}
            >
              {t('common.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t('accountingPages.createSession')}
            </Button>
          </Space>
        }
      />

      <Card size="small" style={{ marginBottom: token.marginMD }}>
        <Space wrap>
          <Select
            placeholder={t('accountingPages.selectCustomer')}
            style={{ width: 280 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            options={customerOptions}
          />
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'draft', label: 'Bản nháp' },
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'locked', label: 'Đã khóa' },
            ]}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title="Phiên đối soát" size="small" loading={sessionsQuery.isLoading}>
            {sessions.length === 0 ? (
              <Empty description={t('accountingPages.reconciliationEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table<ReconciliationSession>
                size="small"
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
                dataSource={sessions}
                onRow={(record) => ({
                  onClick: () => setActiveSession(record),
                  style: { cursor: 'pointer' },
                })}
                rowClassName={(record) => (record.id === activeSession?.id ? 'ant-table-row-selected' : '')}
                columns={[
                  {
                    title: 'Khách hàng',
                    key: 'customer',
                    render: (_, r) => r.customer?.name ?? `KH #${r.customer_id}`,
                    ellipsis: true,
                  },
                  {
                    title: 'Kỳ',
                    key: 'period',
                    render: (_, r) =>
                      r.period_from && r.period_to
                        ? `${formatDate(r.period_from)} → ${formatDate(r.period_to)}`
                        : '—',
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (v: string) => {
                      const cfg = STATUS_LABEL[v] ?? { color: 'default', label: v };
                      return <Tag color={cfg.color}>{cfg.label}</Tag>;
                    },
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={14}>
          {!activeSession ? (
            <Card>
              <Empty description="Chọn một phiên để xem chi tiết" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          ) : (
            <>
              <Card
                title={
                  <Space>
                    <Text strong>
                      {activeSession.customer?.name ?? `KH #${activeSession.customer_id}`} |{' '}
                      {activeSession.period_from && activeSession.period_to
                        ? `${formatDate(activeSession.period_from)} → ${formatDate(activeSession.period_to)}`
                        : ''}
                    </Text>
                    <Tag color={STATUS_LABEL[activeSession.status]?.color ?? 'default'}>
                      {STATUS_LABEL[activeSession.status]?.label ?? activeSession.status}
                    </Tag>
                  </Space>
                }
                style={{ marginBottom: token.marginMD }}
              >
                <Row gutter={24}>
                  <Col>
                    <Statistic
                      title={t('accountingPages.reconciliationStatTrips')}
                      value={items.length}
                      suffix={t('accountingPages.revenueTripUnit')}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title={t('accountingPages.reconciliationStatOriginal')}
                      value={totalOriginal}
                      formatter={(v) => formatMoney(Number(v))}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title={t('accountingPages.reconciliationStatAdjustment')}
                      value={totalAdjustment}
                      formatter={(v) => formatMoney(Number(v))}
                      valueStyle={{
                        color: totalAdjustment < 0 ? token.colorError : token.colorSuccess,
                      }}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title={t('accountingPages.reconciliationStatFinal')}
                      value={totalAdjusted}
                      formatter={(v) => formatMoney(Number(v))}
                      valueStyle={{ color: token.colorPrimary, fontWeight: 600 }}
                    />
                  </Col>
                </Row>
              </Card>

              <Card>
                {isLocked ? (
                  <Alert
                    type="info"
                    showIcon
                    icon={<LockOutlined />}
                    message="Phiên đã khóa"
                    description="Phiên này đã được khóa theo R07. Mọi nội dung là chỉ đọc; bạn chỉ có thể tạo phiên mới."
                    style={{ marginBottom: token.marginMD }}
                  />
                ) : null}

                <div style={{ marginBottom: token.marginMD }}>
                  <Steps
                    size="small"
                    current={isLocked ? 2 : isConfirmed ? 1 : 0}
                    items={[
                      { title: 'Bản nháp', icon: <FileTextOutlined /> },
                      { title: 'Đã xác nhận', icon: <CheckOutlined /> },
                      { title: 'Đã khóa', icon: <LockOutlined /> },
                    ]}
                  />
                </div>

                <Table<ReconciliationItem>
                  dataSource={items}
                  loading={itemsQuery.isLoading}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: t('accountingPages.revenueTableCode'), dataIndex: 'trip_code', key: 'trip_code', width: 130 },
                    {
                      title: t('accountingPages.revenueTableDate'),
                      dataIndex: 'scheduled_date',
                      key: 'scheduled_date',
                      render: (v?: string) => (v ? formatDate(v) : '—'),
                      width: 100,
                    },
                    {
                      title: t('accountingPages.reconciliationRoute'),
                      key: 'route',
                      render: (_, r) => `${r.start_point ?? ''} → ${r.end_point ?? ''}`,
                      ellipsis: true,
                    },
                    {
                      title: t('accountingPages.reconciliationStatOriginal'),
                      dataIndex: 'original_amount',
                      key: 'original_amount',
                      align: 'right',
                      render: (v: number) => formatMoney(v ?? 0),
                      width: 130,
                    },
                    {
                      title: t('accountingPages.reconciliationAdjustedAmount'),
                      key: 'adjusted',
                      width: 160,
                      render: (_, r) => (
                        <InputNumber
                          size="small"
                          style={{ width: '100%' }}
                          value={r.adjusted_amount ?? r.original_amount ?? 0}
                          min={0}
                          disabled={isLocked}
                          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          onBlur={(e) => {
                            const text = (e.target as HTMLInputElement).value.replace(/,/g, '');
                            const num = Number(text);
                            if (Number.isFinite(num) && num !== r.adjusted_amount) {
                              updateItemMutation.mutate({ itemId: r.id, amount: num });
                            }
                          }}
                        />
                      ),
                    },
                  ]}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>{t('accountingPages.reconciliationTableTotal')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <strong>{formatMoney(totalOriginal)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <strong>{formatMoney(totalAdjusted)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
                {!isLocked ? (
                  <div style={{ marginTop: token.marginMD, textAlign: 'right' }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        disabled={isConfirmed}
                        loading={confirmMutation.isPending}
                        onClick={() => {
                          modal.confirm({
                            title: 'Xác nhận phiên?',
                            content: 'Sau khi xác nhận, các thay đổi sẽ phải qua quy trình duyệt.',
                            okText: 'Xác nhận',
                            cancelText: 'Hủy',
                            onOk: () => confirmMutation.mutate(),
                          });
                        }}
                      >
                        {t('accountingPages.reconciliationConfirm')}
                      </Button>
                      <Button
                        danger
                        icon={<LockOutlined />}
                        disabled={!isConfirmed}
                        loading={lockMutation.isPending}
                        onClick={() => {
                          modal.confirm({
                            title: 'Khóa phiên?',
                            content: 'Phiên đã khóa sẽ không cho phép chỉnh sửa.',
                            okText: 'Khóa',
                            cancelText: 'Hủy',
                            okButtonProps: { danger: true },
                            onOk: () => lockMutation.mutate(),
                          });
                        }}
                      >
                        Khóa phiên
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div style={{ marginTop: token.marginMD, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateOpen(true)}
                    >
                      Tạo phiên mới
                    </Button>
                  </div>
                )}
              </Card>
            </>
          )}
        </Col>
      </Row>

      <Modal
        title="Tạo phiên đối soát"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createMutation.mutate()}
        confirmLoading={createMutation.isPending}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <Text strong>Khách hàng *</Text>
            <Select
              placeholder={t('accountingPages.selectCustomer')}
              style={{ width: '100%', marginTop: 4 }}
              showSearch
              optionFilterProp="label"
              value={createCustomerId}
              onChange={setCreateCustomerId}
              options={customerOptions}
            />
          </div>
          <div>
            <Text strong>Kỳ *</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 4 }}
              value={createPeriod}
              onChange={(v) => v && setCreatePeriod(v as [dayjs.Dayjs, dayjs.Dayjs])}
              format="DD/MM/YYYY"
            />
          </div>
          <div>
            <Text strong>Ghi chú</Text>
            <Input.TextArea
              rows={3}
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              placeholder="Thông tin bổ sung (tuỳ chọn)"
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
