import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Space,
  Table,
  Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTable, useSelect } from '@refinedev/antd';
import { useTranslation } from '@/hooks/useTranslation';
import type { ViolationRecord as WorkforceViolation, Driver } from '@/types';
import { formatDate } from '@/utils/displayFormat';
import {
  VIOLATION_STATUS_COLOR,
} from '@/pages/system/components/workforce-ops.constants';
import { StatusTag, DetailDescriptions } from '@/pages/system/components/workforce-ops-ui';
import { FormItemSelect, FormItemDatePicker } from '@/components/form';

export const WorkforceViolationTab = () => {
  const { t } = useTranslation();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<WorkforceViolation | null>(null);

  const { tableProps, searchFormProps } = useTable<WorkforceViolation>({
    resource: 'violations',
    onSearch: (values: any) => {
      return [
        { field: 'driver_id', operator: 'eq', value: values.driver_id },
        { field: 'date', operator: 'eq', value: values.date?.format('YYYY-MM-DD') },
      ];
    },
  });

  const { selectProps: driverSelectProps } = useSelect<Driver>({
    resource: 'drivers',
    optionLabel: 'name',
  });
  const { options: driverOptions = [], ...driverSelectRest } = driverSelectProps;

  const columns: ColumnsType<WorkforceViolation> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (_, row) => (row as { driver?: { name?: string } }).driver?.name || `#${row.driver_id}` },
    { title: t('common.date' as never), dataIndex: 'date', render: (v) => formatDate(v) },
    { title: t('workforce.violationType' as never), dataIndex: 'type_code' },
    {
      title: t('workforce.severity' as never),
      dataIndex: 'severity',
      render: (v: string) => <StatusTag value={v} colorMap={VIOLATION_STATUS_COLOR} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v} colorMap={VIOLATION_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Button size="small" onClick={() => { setDetailData(row); setDetailOpen(true); }}>
          {t('common.view')}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card size="small" variant="borderless">
        <Form {...searchFormProps} layout="inline">
          <FormItemSelect
            name="driver_id"
            label={t('drivers.title' as never)}
            options={driverOptions}
            selectProps={driverSelectRest}
            style={{ minWidth: 200 }}
          />
          <FormItemDatePicker name="date" label={t('common.date' as never)} />
          <Button type="primary" onClick={searchFormProps.form?.submit}>{t('common.filter')}</Button>
          <Button onClick={() => searchFormProps.form?.resetFields()}>{t('common.reset')}</Button>
        </Form>
      </Card>

      <Table {...tableProps} columns={columns} rowKey="id" />

      <Modal
        title={t('workforce.violationDetail' as never)}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {detailData && <DetailDescriptions kind="violations" data={detailData as unknown as Record<string, unknown>} />}
      </Modal>
    </Space>
  );
};
