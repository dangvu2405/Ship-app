import {
  ArrowLeftOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  HistoryOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Form, Input, InputNumber, Modal, Select, Space, Spin, Statistic, Table, Tag, Tabs, Typography } from 'antd';
import { useNavigation } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { useBoolean } from '@/hooks/useBoolean';
import { useCreateCustomerPayment, useCustomerDebt, useCustomerDetail, useCustomerPayments, useCustomerTrips } from '@/hooks/useCustomers';

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

export function CustomerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list, edit } = useNavigation();
  const [paymentForm] = Form.useForm();
  const paymentModal = useBoolean(false);
  const resolvedId = id ? Number(id) : undefined;

  const { customer, loading: isLoading } = useCustomerDetail(resolvedId, !!resolvedId);
  const { trips, loading: tripsLoading } = useCustomerTrips(resolvedId, { enabled: !!resolvedId });
  const { payments, loading: paymentsLoading, refetch: refetchPayments } = useCustomerPayments(resolvedId, { enabled: !!resolvedId });
  const { debt } = useCustomerDebt(resolvedId, !!resolvedId);
  const { mutate: createPayment, isPending: isCreatingPayment } = useCreateCustomerPayment(resolvedId);

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

  if (!customer) {
    return <Empty description="Không tìm thấy khách hàng" />;
  }

  const handleCreatePayment = (values: { amount: number; payment_method?: string; payment_date?: string; note?: string }) => {
    if (!resolvedId) return;
    createPayment(
      {
        amount: values.amount,
        payment_method: values.payment_method as 'cash' | 'bank_transfer' | 'check' | undefined,
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
        <Card>
          <Empty description="Chức năng bảng giá sẽ được bổ sung" />
        </Card>
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
                valueStyle={{ color: '#1677ff' }}
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
                dataSource={payments}
                columns={[
                  { title: 'Ngày', dataIndex: 'payment_date', key: 'payment_date', render: (value) => formatDate(value) },
                  { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (value) => formatMoney(Number(value)), align: 'right' },
                  { title: 'Hình thức', dataIndex: 'payment_method', key: 'payment_method', render: (value) => value ?? '—' },
                  { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true },
                ]}
              />
            )}
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
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleCreatePayment}>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: 'Nhập số tiền' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>
          <Form.Item name="payment_method" label="Hình thức thanh toán">
            <Select
              allowClear
              options={[
                { label: 'Tiền mặt', value: 'cash' },
                { label: 'Chuyển khoản', value: 'bank_transfer' },
                { label: 'Séc', value: 'check' },
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
    </div>
  );
}
