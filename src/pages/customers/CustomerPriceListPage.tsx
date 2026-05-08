import { useState } from 'react';
import { App, Button, Card, DatePicker, Empty, Flex, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useCustomerList, useCustomerPriceLists, useCreatePriceList, useAddPriceListItem } from '@/hooks/useCustomers';
import type { PriceList } from '@/types/api/customer';


import { ROUTES } from '@/routes';

const PRICE_UNIT_LABEL: Record<string, string> = {
  per_trip: 'Theo chuyến',
  per_km: 'Theo km',
  per_ton: 'Theo tấn',
};

function PriceListsForCustomer({ customerId }: { customerId: number }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { priceLists, loading } = useCustomerPriceLists(customerId);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [activePriceListId, setActivePriceListId] = useState<number | null>(null);
  const [createListForm] = Form.useForm();
  const [createItemForm] = Form.useForm();

  const { mutateAsync: createPriceList, isPending: creatingList } = useCreatePriceList({
    onSuccess: () => {
      message.success(t('messages.createSuccess'));
      setCreateListOpen(false);
    },
  });

  const { mutateAsync: addPriceListItem, isPending: addingItem } = useAddPriceListItem({
    onSuccess: () => {
      message.success(t('messages.createSuccess'));
      setCreateItemOpen(false);
    },
  });

  const columns: ColumnsType<PriceList> = [
    { key: 'name', title: t('customers.priceListName'), dataIndex: 'name' },
    {
      key: 'effective_from',
      title: t('customers.effectiveFrom'),
      dataIndex: 'effective_from',
    },
    {
      key: 'effective_to',
      title: t('customers.effectiveTo'),
      render: (_, r) => r.effective_to ?? '—',
    },
    {
      key: 'notes',
      title: t('customers.notes'),
      render: (_, r) => r.notes ?? '—',
    },
    {
      key: 'actions',
      title: t('common.actions'),
      fixed: 'right',
      width: 120,
      render: (_, r) => (
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => {
            setActivePriceListId(r.id);
            createItemForm.resetFields();
            setCreateItemOpen(true);
          }}
        >
          Thêm giá
        </Button>
      ),
    },
  ];

  return (
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            createListForm.resetFields();
            setCreateListOpen(true);
          }}
        >
          {t('customers.addPriceList')}
        </Button>
      </Flex>

      <Table<PriceList>
        rowKey="id"
        columns={columns}
        dataSource={priceLists}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Chưa có bảng giá nào' }}
      />

      {/* Create price list modal */}
      <Modal
        title={t('customers.addPriceList')}
        open={createListOpen}
        onCancel={() => setCreateListOpen(false)}
        onOk={() => createListForm.submit()}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
        confirmLoading={creatingList}
        destroyOnHidden
        maskClosable={false}
      >
        <Form
          form={createListForm}
          name="customer-price-list-form"
          layout="vertical"
          onFinish={async (vals: { name: string; effective_from?: Dayjs; effective_to?: Dayjs; notes?: string }) => {
            await createPriceList({
              customerId,
              values: {
                name: vals.name,
                effective_from: vals.effective_from ? vals.effective_from.format('YYYY-MM-DD') : '',
                effective_to: vals.effective_to ? vals.effective_to.format('YYYY-MM-DD') : undefined,
                notes: vals.notes,
              },
            });
          }}
        >
          <Form.Item name="name" label={t('customers.priceListName')} rules={[{ required: true, message: 'Nhập tên bảng giá' }]}>
            <Input placeholder="VD: Bảng giá Q1/2025" />
          </Form.Item>
          <Form.Item name="effective_from" label={t('customers.effectiveFrom')} rules={[{ required: true, message: 'Chọn ngày áp dụng' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="effective_to" label={t('customers.effectiveTo')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="notes" label={t('customers.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add price item modal */}
      <Modal
        title={t('customers.addPriceItem')}
        open={createItemOpen}
        onCancel={() => setCreateItemOpen(false)}
        onOk={() => createItemForm.submit()}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
        confirmLoading={addingItem}
        destroyOnHidden
        maskClosable={false}
      >
        <Form
          form={createItemForm}
          name="customer-price-item-form"
          layout="vertical"
          onFinish={async (vals) => {
            if (!activePriceListId) return;
            await addPriceListItem({
              priceListId: activePriceListId,
              values: {
                price: vals.price as number,
                price_unit: vals.price_unit as 'per_trip' | 'per_km' | 'per_ton',
                notes: vals.notes as string | undefined,
              },
            });
          }}
        >
          <Form.Item name="price_unit" label={t('customers.priceUnit')} rules={[{ required: true, message: 'Chọn đơn vị tính giá' }]}>
            <Select options={Object.entries(PRICE_UNIT_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="price" label={t('customers.price')} rules={[{ required: true, message: 'Nhập giá' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
          </Form.Item>
          <Form.Item name="notes" label={t('customers.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export function CustomerPriceListPage() {
  const { t } = useTranslation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const { data: customers, loading: customersLoading } = useCustomerList({ pageSize: 200 });

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name}${c.code ? ` (${c.code})` : ''}`,
  }));

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.priceList')}
        description="Quản lý bảng giá theo khách hàng"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('customers.title'), path: ROUTES.admin.customers.list },
          { label: t('sidebar.priceList') },
        ]}
      />

      <Card>
        <Space style={{ marginBottom: 20 }} wrap>
          <Typography.Text strong>Khách hàng:</Typography.Text>
          <Select
            showSearch
            style={{ width: 320 }}
            placeholder="Tìm kiếm khách hàng..."
            loading={customersLoading}
            value={selectedCustomerId}
            onChange={(v) => setSelectedCustomerId(v as number)}
            options={customerOptions}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            allowClear
            onClear={() => setSelectedCustomerId(undefined)}
          />
        </Space>

        {selectedCustomerId == null ? (
          <Empty description="Chọn khách hàng để xem và quản lý bảng giá" style={{ padding: '40px 0' }} />
        ) : (
          <PriceListsForCustomer customerId={selectedCustomerId} />
        )}
      </Card>
    </div>
  );
}
