import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
} from 'antd';
import { DollarOutlined, ExportOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney } from '@/utils/displayFormat';
import { useReport, useExportReport } from '@/hooks/useReports';
import invoiceService from '@/services/invoice.service';
import customerService from '@/services/customer.service';
import { useCustomerList } from '@/hooks/useCustomers';
import { getErrorMessage } from '@/utils/errorHandler';

interface DebtRow {
  customer_id: number;
  customer_name: string;
  type?: string;
  total_debt?: number;
  overdue_amount?: number;
  bucket_0_30?: number;
  bucket_31_60?: number;
  bucket_61_90?: number;
  bucket_90_plus?: number;
  contact?: string;
  trips_count?: number;
  overdue_count?: number;
}

interface DebtAggregate {
  total_debt?: number;
  overdue_amount?: number;
  total_uncollected?: number;
  customers?: DebtRow[];
  data?: DebtRow[];
  by_aging?: { '0_30'?: number; '31_60'?: number; '61_90'?: number; '90_plus'?: number };
}

interface PaymentFormValues {
  amount: number;
  payment_method?: 'cash' | 'bank_transfer' | 'check';
  payment_date?: dayjs.Dayjs;
  note?: string;
}

export function DebtPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentRow, setPaymentRow] = useState<DebtRow | null>(null);
  const [paymentForm] = Form.useForm<PaymentFormValues>();

  const { data: aggregate, refetch: refetchAggregate } = useReport<DebtAggregate>('debt', {});
  const debtFromReport = useMemo(() => (aggregate?.customers ?? aggregate?.data ?? []) as DebtRow[], [aggregate?.customers, aggregate?.data]);

  const overviewQuery = useQuery({
    queryKey: ['debt-overview'] as const,
    queryFn: async () => {
      try {
        return await invoiceService.getDebtOverview();
      } catch {
        return null;
      }
    },
  });
  const overview = overviewQuery.data;

  const { data: customers } = useCustomerList({ current: 1, pageSize: 200 });
  const customerMap = useMemo(() => {
    const m = new Map<number, { id: number; name?: string; type?: string; phone?: string }>();
    (customers ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const debtRows: DebtRow[] = useMemo(() => {
    return (debtFromReport ?? []).map((r) => {
      const meta = customerMap.get(r.customer_id);
      return {
        ...r,
        customer_name: r.customer_name ?? meta?.name ?? `KH #${r.customer_id}`,
        type: r.type ?? meta?.type,
        contact: r.contact ?? meta?.phone,
      };
    });
  }, [debtFromReport, customerMap]);

  const totalDebt = aggregate?.total_debt ?? overview?.total_uncollected ?? debtRows.reduce((s, r) => s + (r.total_debt ?? 0), 0);
  const overdueDebt = aggregate?.overdue_amount ?? Number(overview?.overdue_amount ?? 0) ?? debtRows.reduce((s, r) => s + (r.overdue_amount ?? 0), 0);
  const overdueCount = debtRows.filter((r) => (r.overdue_amount ?? 0) > 0).length;

  const filtered = useMemo(() => {
    if (!statusFilter) return debtRows;
    if (statusFilter === 'overdue') return debtRows.filter((r) => (r.overdue_amount ?? 0) > 0);
    return debtRows;
  }, [debtRows, statusFilter]);

  const paymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      if (!paymentRow) throw new Error('Khách hàng không hợp lệ');
      return customerService.createPayment(paymentRow.customer_id, {
        amount: values.amount,
        payment_method: values.payment_method ?? 'bank_transfer',
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : undefined,
        note: values.note,
      });
    },
    onSuccess: () => {
      message.success('Đã ghi nhận thanh toán');
      setPaymentOpen(false);
      paymentForm.resetFields();
      void refetchAggregate();
      void overviewQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => {
      message.error(getErrorMessage(err));
    },
  });

  const handleOpenPayment = (row: DebtRow) => {
    setPaymentRow(row);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: row.overdue_amount ?? row.total_debt ?? 0,
      payment_method: 'bank_transfer',
      payment_date: dayjs(),
    });
    setPaymentOpen(true);
  };

  const { exportReport } = useExportReport();
  const handleExport = async () => {
    try {
      const result = await exportReport('debt', { status: statusFilter }, 'xlsx');
      if (result?.url || result?.file) {
        window.open(result.url ?? result.file ?? '', '_blank');
      } else {
        message.info(t('accountingPages.exportSoon'));
      }
    } catch {
      message.error('Xuất báo cáo thất bại');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('accountingPages.debtTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.debtTitle') },
        ]}
        actions={
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            {t('accountingPages.exportExcel')}
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: token.marginMD }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatTotal')}
              value={Number(totalDebt) || 0}
              formatter={(v) => formatMoney(Number(v))}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatOverdue30')}
              value={Number(overdueDebt) || 0}
              formatter={(v) => formatMoney(Number(v))}
              prefix={<WarningOutlined />}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatCustomers')}
              value={debtRows.length}
              suffix={t('accountingPages.debtCustomersSuffix')}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatOverdueCustomers')}
              value={overdueCount}
              suffix={t('accountingPages.debtCustomersSuffix')}
              valueStyle={{ color: overdueCount > 0 ? token.colorError : undefined }}
            />
          </Card>
        </Col>
      </Row>

      {aggregate?.by_aging && (
        <Row gutter={16} style={{ marginBottom: token.marginMD }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="0–30 ngày" value={aggregate.by_aging['0_30'] ?? 0} formatter={(v) => formatMoney(Number(v))} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="31–60 ngày" value={aggregate.by_aging['31_60'] ?? 0} formatter={(v) => formatMoney(Number(v))} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="61–90 ngày" value={aggregate.by_aging['61_90'] ?? 0} formatter={(v) => formatMoney(Number(v))} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="> 90 ngày" value={aggregate.by_aging['90_plus'] ?? 0} formatter={(v) => formatMoney(Number(v))} valueStyle={{ color: token.colorError }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card size="small" style={{ marginBottom: token.marginMD }}>
        <Space>
          <Select
            placeholder={t('accountingPages.debtFilterStatus')}
            allowClear
            style={{ width: 200 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'overdue', label: t('accountingPages.debtFilterOverdue') },
            ]}
          />
        </Space>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <Empty description={t('accountingPages.debtEmpty')} />
        ) : (
          <Table<DebtRow>
            dataSource={filtered}
            rowKey={(r) => r.customer_id}
            size="small"
            pagination={{ pageSize: 20, size: 'small' }}
            scroll={{ x: 'max-content' }}
            onRow={(r) => ({
              style:
                (r.overdue_amount ?? 0) > 0
                  ? { background: token.colorErrorBg }
                  : undefined,
            })}
            columns={[
              {
                title: t('accountingPages.debtColCustomer'),
                key: 'customer',
                render: (_, r) => r.customer_name,
              },
              {
                title: t('accountingPages.debtColType'),
                key: 'type',
                render: (_, r) =>
                  r.type ? (
                    <Tag color={r.type === 'company' ? 'blue' : 'purple'}>
                      {r.type === 'company'
                        ? t('accountingPages.debtTypeCompany')
                        : t('accountingPages.debtTypePerson')}
                    </Tag>
                  ) : '—',
                width: 90,
              },
              {
                title: t('accountingPages.debtColTrips'),
                key: 'trips',
                render: (_, r) => r.trips_count ?? '—',
                align: 'center',
                width: 90,
              },
              {
                title: t('accountingPages.debtColTotal'),
                key: 'debt',
                align: 'right',
                render: (_, r) => formatMoney(r.total_debt ?? 0),
              },
              {
                title: 'Quá hạn',
                key: 'overdue_amount',
                align: 'right',
                render: (_, r) =>
                  (r.overdue_amount ?? 0) > 0 ? (
                    <span style={{ color: token.colorError, fontWeight: 600 }}>
                      {formatMoney(r.overdue_amount ?? 0)}
                    </span>
                  ) : (
                    '—'
                  ),
              },
              {
                title: t('accountingPages.debtColPhone'),
                key: 'phone',
                render: (_, r) => r.contact ?? '—',
              },
              {
                title: t('common.actions'),
                key: 'actions',
                fixed: 'right',
                width: 130,
                render: (_, r) => (
                  <Button
                    size="small"
                    type="link"
                    icon={<DollarOutlined />}
                    onClick={() => handleOpenPayment(r)}
                  >
                    Ghi nhận TT
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Drawer
        title={paymentRow ? `Ghi nhận thanh toán — ${paymentRow.customer_name}` : 'Ghi nhận thanh toán'}
        placement="right"
        width={Math.min(540, typeof window !== 'undefined' ? window.innerWidth - 40 : 540)}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setPaymentOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              loading={paymentMutation.isPending}
              onClick={() =>
                paymentForm
                  .validateFields()
                  .then((values) => paymentMutation.mutate(values))
                  .catch(() => undefined)
              }
            >
              Ghi nhận
            </Button>
          </Space>
        }
      >
        <Form<PaymentFormValues> form={paymentForm} name="debt-payment-form" layout="vertical">
          <Form.Item
            label="Số tiền"
            name="amount"
            rules={[{ required: true, message: 'Nhập số tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => Number((v ?? '').replace(/,/g, '')) as unknown as 0}
            />
          </Form.Item>
          <Form.Item label="Hình thức" name="payment_method">
            <Select
              options={[
                { value: 'bank_transfer', label: 'Chuyển khoản' },
                { value: 'cash', label: 'Tiền mặt' },
                { value: 'check', label: 'Séc' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Ngày thanh toán" name="payment_date">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
