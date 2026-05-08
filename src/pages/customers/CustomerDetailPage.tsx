import { useState } from 'react';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  HistoryOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Form, Input, InputNumber, Modal, Result, Select, Space, Spin, Statistic, Table, Tag, Tabs, Typography, theme } from 'antd';
import { useNavigation } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { useBoolean } from '@/hooks/useBoolean';
import {
  useAddPriceListItem,
  useCreateCustomerPayment,
  useCreatePriceList,
  useCustomerDebt,
  useCustomerDetail,
  useCustomerPayments,
  useCustomerPriceLists,
  useCustomerReconciliations,
  useCustomerTrips,
} from '@/hooks/useCustomers';
import customerService from '@/services/customer.service';
import { useQuery } from '@tanstack/react-query';

const { Text } = Typography;

const TRIP_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};
const TRIP_STATUS_LABEL: Record<string, string> = {
  pending: 'Mới',
  in_progress: 'Đang vận chuyển',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const RECONCILIATION_STATUS_COLOR: Record<string, string> = {
  draft: 'gold',
  confirmed: 'blue',
  locked: 'green',
};

export function CustomerDetailPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { id } = useParams<{ id?: string }>();
  const { list, edit } = useNavigation();
  const [paymentForm] = Form.useForm();
  const paymentModal = useBoolean(false);
  const priceListModal = useBoolean(false);
  const priceItemModal = useBoolean(false);
  const [priceListForm] = Form.useForm();
  const [priceItemForm] = Form.useForm();
  const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(null);
  const resolvedId = id ? Number(id) : undefined;

  const { customer, loading: isLoading, error: detailError } = useCustomerDetail(resolvedId, !!resolvedId);
  const { trips, loading: tripsLoading } = useCustomerTrips(resolvedId, { enabled: !!resolvedId });
  const { payments, loading: paymentsLoading, refetch: refetchPayments } = useCustomerPayments(resolvedId, { enabled: !!resolvedId });
  const { debt } = useCustomerDebt(resolvedId, !!resolvedId);
  const { priceLists, loading: priceListsLoading, refetch: refetchPriceLists } = useCustomerPriceLists(resolvedId, !!resolvedId);
  const { sessions, loading: reconciliationLoading } = useCustomerReconciliations(resolvedId, { enabled: !!resolvedId });
  const { mutate: createPayment, isPending: isCreatingPayment } = useCreateCustomerPayment(resolvedId);
  const { mutate: createPriceList, isPending: isCreatingPriceList } = useCreatePriceList();
  const { mutate: addPriceItem, isPending: isCreatingPriceItem } = useAddPriceListItem();
  const { data: routeTemplatesData } = useQuery({
    queryKey: ['route-templates', 'customers'],
    queryFn: () => customerService.getRouteTemplates({ pageSize: 200 }),
    enabled: !!resolvedId,
  });
  const routeTemplates = (routeTemplatesData?.data?.data ?? []) as { id: number; name?: string }[];

  const totalRevenue = trips
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.price ?? 0), 0);
  const totalDebt = debt?.total_debt ?? totalRevenue;
  const totalPaid = debt?.paid_amount ?? payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const remainingDebt = debt?.remaining_debt ?? Math.max(totalDebt - totalPaid, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (detailError) {
    const lower = String(detailError).toLowerCase();
    if (lower.includes('403') || lower.includes('forbidden')) {
      return <Result status="403" title="403" subTitle={t('common.forbidden')} />;
    }
  }

  if (!customer) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="Không tìm thấy khách hàng"
        extra={<Button onClick={() => list('customers')}>{t('common.back')}</Button>}
      />
    );
  }

  const handleCreatePayment = (values: { amount: number; payment_method?: string; payment_date?: string; note?: string }) => {
    if (!resolvedId) return;
    createPayment(
      {
        amount: values.amount,
        payment_method: values.payment_method as 'cash' | 'bank_transfer' | 'credit' | undefined,
        payment_date: values.payment_date,
        note: values.note,
      },
      {
        onSuccess: () => {
          paymentModal.setFalse();
          paymentForm.resetFields();
          void refetchPayments();
        },
      }
    );
  };

  const handleCreatePriceList = () => {
    if (!resolvedId) return;
    priceListForm
      .validateFields()
      .then((values: { name: string; effective_from: string; effective_to?: string; notes?: string }) => {
        createPriceList(
          { customerId: resolvedId, values },
          {
            onSuccess: () => {
              priceListModal.setFalse();
              priceListForm.resetFields();
              void refetchPriceLists();
            },
          },
        );
      })
      .catch(() => undefined);
  };

  const handleCreatePriceListItem = () => {
    if (!selectedPriceListId) return;
    priceItemForm
      .validateFields()
      .then((values: { route_template_id?: number; vehicle_type_id?: number; cargo_type_id?: number; price: number; price_unit: 'per_trip' | 'per_km' | 'per_ton'; notes?: string }) => {
        addPriceItem(
          { priceListId: selectedPriceListId, values },
          {
            onSuccess: () => {
              priceItemModal.setFalse();
              priceItemForm.resetFields();
              void refetchPriceLists();
            },
          },
        );
      })
      .catch(() => undefined);
  };

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <UserOutlined /> Thông tin
        </span>
      ),
      children: (
        <Card>
          <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
            <Descriptions.Item label="Tên KH">
              <Text strong>{customer.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              <Tag color={customer.type === 'company' ? 'blue' : 'purple'}>
                {customer.type === 'company' ? t('customers.typeCompany') : t('customers.typeIndividual')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mã số thuế">{customer.tax_code ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Điện thoại">{customer.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{customer.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Người liên hệ">{customer.contact_person ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={3}>{customer.address ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(customer.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'price',
      label: (
        <span>
          <DollarOutlined /> Bảng giá
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={priceListModal.setTrue}>
                {t('customers.addPriceList')}
              </Button>
            }
          >
            <Table
              rowKey="id"
              loading={priceListsLoading}
              dataSource={priceLists}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: t('common.noData') }}
              columns={[
                { title: t('customers.priceListName'), dataIndex: 'name', key: 'name' },
                { title: t('customers.effectiveFrom'), dataIndex: 'effective_from', key: 'effective_from' },
                { title: t('customers.effectiveTo'), dataIndex: 'effective_to', key: 'effective_to', render: (value) => value ?? '—' },
                {
                  title: t('common.actions'),
                  key: 'actions',
                  render: (_value, record) => (
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedPriceListId(record.id);
                        priceItemModal.setTrue();
                      }}
                    >
                      {t('customers.addPriceItem')}
                    </Button>
                  ),
                },
              ]}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    dataSource={record.items ?? []}
                    columns={[
                      { title: t('customers.routeTemplate'), dataIndex: 'route_template_id', key: 'route_template_id' },
                      { title: t('customers.vehicleType'), dataIndex: 'vehicle_type_id', key: 'vehicle_type_id' },
                      { title: t('customers.cargoType'), dataIndex: 'cargo_type_id', key: 'cargo_type_id' },
                      { title: t('customers.priceUnit'), dataIndex: 'price_unit', key: 'price_unit' },
                      { title: t('customers.price'), dataIndex: 'price', key: 'price', align: 'right', render: (value) => formatMoney(Number(value)) },
                    ]}
                  />
                ),
              }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <HistoryOutlined /> Lịch sử đơn hàng{' '}
          {trips.length > 0 && <Tag>{trips.length}</Tag>}
        </span>
      ),
      children: (
        <Card>
          <Table<Trip>
            dataSource={trips}
            loading={tripsLoading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 15, size: 'small' }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có đơn hàng' }}
            columns={[
              { title: 'Mã đơn', dataIndex: 'code', key: 'code' },
              { title: 'Điểm lấy', dataIndex: 'start_point', key: 'start_point', ellipsis: true },
              { title: 'Điểm giao', dataIndex: 'end_point', key: 'end_point', ellipsis: true },
              {
                title: 'Doanh thu',
                dataIndex: 'price',
                key: 'price',
                render: (v: number) => formatMoney(v),
                align: 'right',
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => (
                  <Tag color={TRIP_STATUS_COLOR[v] ?? 'default'}>
                    {TRIP_STATUS_LABEL[v] ?? v}
                  </Tag>
                ),
              },
              {
                title: 'Ngày tạo',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (v) => formatDate(v),
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'debt',
      label: (
        <span>
          <DollarOutlined /> Công nợ
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card>
            <Space size="large">
              <Statistic
                title="Tổng công nợ"
                value={totalDebt}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: '#3f8600' }}
              />
              <Statistic
                title="Đã thu"
                value={totalPaid}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: token.colorPrimary }}
              />
              <Statistic
                title="Còn phải thu"
                value={remainingDebt}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: '#cf1322' }}
              />
              <Statistic title="Tổng số chuyến" value={trips.length} suffix="chuyến" />
            </Space>
          </Card>
          <Card
            title="Phiếu thanh toán"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={paymentModal.setTrue}>
                Ghi nhận thanh toán
              </Button>
            }
          >
            {paymentsLoading ? (
              <Spin />
            ) : payments.length === 0 ? (
              <Empty description="Chưa có phiếu thanh toán" />
            ) : (
              <Table
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10, size: 'small' }}
                scroll={{ x: 'max-content' }}
                dataSource={payments}
                columns={[
                  { title: 'Ngày', dataIndex: 'payment_date', key: 'payment_date', render: (value) => formatDate(value) },
                  { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (value) => formatMoney(Number(value)), align: 'right' },
                  { title: 'Hình thức', dataIndex: 'payment_method', key: 'payment_method', render: (value) => value ?? '—' },
                  { title: 'Mã GD', dataIndex: 'transaction_code', key: 'transaction_code', render: (value) => value ?? '—' },
                  { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true },
                ]}
              />
            )}
          </Card>
          <Card title={t('customers.reconciliationSessions')}>
            <Table
              rowKey="id"
              loading={reconciliationLoading}
              dataSource={sessions}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: t('common.noData') }}
              columns={[
                { title: t('customers.periodFrom'), dataIndex: 'period_from', key: 'period_from' },
                { title: t('customers.periodTo'), dataIndex: 'period_to', key: 'period_to' },
                { title: t('customers.totalTrips'), dataIndex: 'total_trips', key: 'total_trips' },
                { title: t('customers.finalAmount'), dataIndex: 'final_amount', key: 'final_amount', render: (value) => formatMoney(Number(value)) },
                {
                  title: t('common.status'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (value: string) => <Tag color={RECONCILIATION_STATUS_COLOR[value] ?? 'default'}>{value}</Tag>,
                },
                {
                  title: t('common.actions'),
                  key: 'actions',
                  render: (_value, row) =>
                    row.status === 'locked' ? <Tag color="green">Locked</Tag> : <Button size="small">{t('common.edit')}</Button>,
                },
              ]}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={customer.name}
        breadcrumb={[
          { label: t('customers.title'), path: ROUTES.admin.customers.list },
          { label: customer.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('customers')}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit('customers', customer.id)}
            >
              {t('common.edit')}
            </Button>
          </Space>
        }
      />
      <Tabs items={tabItems} defaultActiveKey="info" />
      <Modal
        title="Ghi nhận thanh toán"
        open={paymentModal.value}
        onCancel={paymentModal.setFalse}
        onOk={() => paymentForm.submit()}
        confirmLoading={isCreatingPayment}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={paymentForm} name="customer-detail-payment-form" layout="vertical" onFinish={handleCreatePayment}>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: 'Nhập số tiền' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>
          <Form.Item name="payment_method" label="Hình thức thanh toán">
            <Select
              allowClear
              options={[
                { label: 'Tiền mặt', value: 'cash' },
                { label: 'Chuyển khoản', value: 'bank_transfer' },
                { label: 'Công nợ', value: 'credit' },
              ]}
            />
          </Form.Item>
          <Form.Item name="payment_date" label="Ngày thanh toán">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={t('customers.addPriceList')}
        open={priceListModal.value}
        onCancel={priceListModal.setFalse}
        onOk={handleCreatePriceList}
        confirmLoading={isCreatingPriceList}
        destroyOnHidden
      >
        <Form form={priceListForm} name="customer-detail-pricelist-form" layout="vertical">
          <Form.Item name="name" label={t('customers.priceListName')} rules={[{ required: true, message: t('validation.required') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="effective_from" label={t('customers.effectiveFrom')} rules={[{ required: true, message: t('validation.required') }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="effective_to" label={t('customers.effectiveTo')}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="notes" label={t('customers.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={t('customers.addPriceItem')}
        open={priceItemModal.value}
        onCancel={priceItemModal.setFalse}
        onOk={handleCreatePriceListItem}
        confirmLoading={isCreatingPriceItem}
        destroyOnHidden
      >
        <Form form={priceItemForm} name="customer-detail-priceitem-form" layout="vertical">
          <Form.Item name="route_template_id" label={t('customers.routeTemplate')}>
            <Select
              allowClear
              options={routeTemplates.map((template: { id: number; name?: string }) => ({ value: template.id, label: template.name ?? `#${template.id}` }))}
            />
          </Form.Item>
          <Form.Item name="vehicle_type_id" label={t('customers.vehicleType')}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cargo_type_id" label={t('customers.cargoType')}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="price" label={t('customers.price')} rules={[{ required: true, message: t('validation.required') }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="price_unit" label={t('customers.priceUnit')} rules={[{ required: true, message: t('validation.required') }]}>
            <Select
              options={[
                { value: 'per_trip', label: 'per_trip' },
                { value: 'per_km', label: 'per_km' },
                { value: 'per_ton', label: 'per_ton' },
              ]}
            />
          </Form.Item>
          <Form.Item name="notes" label={t('customers.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
