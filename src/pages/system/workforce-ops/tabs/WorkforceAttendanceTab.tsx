import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Space,
  Table,
  Modal,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTable, useSelect } from '@refinedev/antd';
import { useTranslation } from '@/hooks/useTranslation';
import workforceOpsService from '@/services/workforce-ops.service';
import type { WorkforceAttendanceRecord, Driver } from '@/types';
import { formatDate, formatDateTime } from '@/utils/displayFormat';
import { requiredRule } from '@/utils/validation';
import dayjs from 'dayjs';
import {
  ATTENDANCE_STATUS_COLOR,
} from '@/pages/system/components/workforce-ops.constants';
import { StatusTag } from '@/pages/system/components/workforce-ops-ui';
import { antdUtils } from '@/utils/antdGlobal';
import { FormItemSelect, FormItemDatePicker, FormItemText } from '@/components/form';

export const WorkforceAttendanceTab = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);

  const { tableProps, searchFormProps, tableQueryResult } = useTable<WorkforceAttendanceRecord>({
    resource: 'attendance',
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

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      antdUtils.getMessage().success(successMsg);
      tableQueryResult.refetch();
    } catch (err: any) {
      antdUtils.getMessage().error(err?.message || t('common.error'));
    }
  };

  const columns: ColumnsType<WorkforceAttendanceRecord> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (_, row) => (row as { driver?: { name?: string } }).driver?.name || `#${row.driver_id}` },
    { title: t('common.date' as never), dataIndex: 'date', render: (v) => formatDate(v) },
    { title: 'Check-in', dataIndex: 'check_in', render: (v) => formatDateTime(v) },
    { title: 'Check-out', dataIndex: 'check_out', render: (v) => formatDateTime(v) },
    { title: t('workforce.workHours' as never), dataIndex: 'work_hours' },
    { title: t('workforce.otHours' as never), dataIndex: 'overtime_hours' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v || ''} colorMap={ATTENDANCE_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Button
          size="small"
          onClick={() => {
            form.setFieldsValue({
              attendance_id: row.id,
              adjust_check_in: row.check_in ? dayjs(row.check_in) : undefined,
              adjust_check_out: row.check_out ? dayjs(row.check_out) : undefined,
              adjust_status: row.status,
              adjust_reason: '',
            });
            setModalOpen(true);
          }}
        >
          {t('common.adjust' as never)}
        </Button>
      ),
    },
  ];

  const handleAdjust = async () => {
    const values = await form.validateFields();
    await handleAction(
      () => workforceOpsService.adjustAttendance(values.attendance_id, {
        reason: values.adjust_reason,
        check_in: values.adjust_check_in?.format('YYYY-MM-DD HH:mm:ss'),
        check_out: values.adjust_check_out?.format('YYYY-MM-DD HH:mm:ss'),
        status: values.adjust_status,
      }),
      t('workforce.adjustAttendanceSuccess' as never)
    );
    setModalOpen(false);
  };

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
        title={t('common.adjust' as never)}
        open={modalOpen}
        onOk={handleAdjust}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="attendance_id" hidden />
          <Row gutter={16}>
            <Col span={12}>
              <FormItemDatePicker name="adjust_check_in" label="Check-in" showTime format="YYYY-MM-DD HH:mm:ss" />
            </Col>
            <Col span={12}>
              <FormItemDatePicker name="adjust_check_out" label="Check-out" showTime format="YYYY-MM-DD HH:mm:ss" />
            </Col>
          </Row>
          <FormItemSelect
            name="adjust_status"
            label={t('common.status')}
            options={Object.keys(ATTENDANCE_STATUS_COLOR).map(k => ({ label: k, value: k }))}
          />
          <FormItemText name="adjust_reason" label={t('common.reason' as never)} rules={[requiredRule(t('common.reason' as never))]} />
        </Form>
      </Modal>
    </Space>
  );
};
