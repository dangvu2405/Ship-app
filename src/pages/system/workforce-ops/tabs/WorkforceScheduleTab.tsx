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
import type { DriverSchedule, Driver, Office, Vehicle } from '@/types';
import { formatDate } from '@/utils/displayFormat';
import { requiredRule } from '@/utils/validation';
import dayjs from 'dayjs';
import {
  SCHEDULE_STATUS_COLOR,
} from '@/pages/system/components/workforce-ops.constants';
import { StatusTag } from '@/pages/system/components/workforce-ops-ui';
import { antdUtils } from '@/utils/antdGlobal';
import { FormItemSelect, FormItemDatePicker, FormItemText } from '@/components/form';

export const WorkforceScheduleTab = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { tableProps, searchFormProps, tableQueryResult } = useTable<DriverSchedule>({
    resource: 'driver-work-schedules', // Matches ENDPOINTS.driverSchedules.base or workforce.driverSchedules
    onSearch: (values: any) => {
      return [
        { field: 'company_id', operator: 'eq', value: values.company_id },
        { field: 'office_id', operator: 'eq', value: values.office_id },
        { field: 'driver_id', operator: 'eq', value: values.driver_id },
        { field: 'work_date', operator: 'eq', value: values.work_date?.format('YYYY-MM-DD') },
      ];
    },
  });

  const { selectProps: driverSelectProps } = useSelect<Driver>({
    resource: 'drivers',
    optionLabel: 'name',
  });

  const { selectProps: officeSelectProps } = useSelect<Office>({
    resource: 'offices',
    optionLabel: 'name',
  });

  const { selectProps: vehicleSelectProps } = useSelect<Vehicle>({
    resource: 'vehicles',
    optionLabel: 'plate_number',
  });

  const { options: driverOptions = [], ...driverSelectRest } = driverSelectProps;
  const { options: officeOptions = [], ...officeSelectRest } = officeSelectProps;
  const { options: vehicleOptions = [], ...vehicleSelectRest } = vehicleSelectProps;

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      antdUtils.getMessage().success(successMsg);
      tableQueryResult.refetch();
    } catch (err: any) {
      antdUtils.getMessage().error(err?.message || t('common.error'));
    }
  };

  const columns: ColumnsType<DriverSchedule> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    {
      title: t('drivers.title' as never),
      dataIndex: 'driver_id',
      render: (_, row) => row.driver?.name || `#${row.driver_id}`,
    },
    { title: t('workforce.workDate' as never), dataIndex: 'work_date', render: (v) => formatDate(v) },
    {
      title: t('offices.title' as never),
      dataIndex: 'office_id',
      render: (_, row) => (row as { office?: { name?: string } }).office?.name || row.office_id || '-',
    },
    {
      title: t('vehicles.title' as never),
      dataIndex: 'vehicle_id',
      render: (_, row) => row.vehicle?.plate_number || (row.vehicle_id ? `#${row.vehicle_id}` : '-'),
    },
    { title: t('workforce.shift' as never), dataIndex: 'shift_code' },
    { title: t('workforce.startTime' as never), dataIndex: 'start_time' },
    { title: t('workforce.endTime' as never), dataIndex: 'end_time' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v ?? 'draft'} colorMap={SCHEDULE_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      width: 400,
      render: (_, row) => {
        const s = row.status;
        return (
          <Space wrap>
            <Button
              size="small"
              disabled={s !== 'submitted'}
              onClick={() => handleAction(() => workforceOpsService.approveDriverSchedule(row.id), t('workforce.scheduleApproved' as never))}
            >
              {t('common.approve' as never)}
            </Button>

            <Button
              size="small"
              disabled={s !== 'approved'}
              onClick={() => handleAction(() => workforceOpsService.lockDriverSchedule(row.id), t('workforce.scheduleLocked' as never))}
            >
              {t('common.lock' as never)}
            </Button>

            <Button
              size="small"
              disabled={s === 'locked'}
              onClick={() => {
                setEditingId(row.id);
                form.setFieldsValue({
                  ...row,
                  work_date: row.work_date ? dayjs(row.work_date) : undefined,
                  start_time: row.start_time ? dayjs(row.start_time, 'HH:mm') : undefined,
                  end_time: row.end_time ? dayjs(row.end_time, 'HH:mm') : undefined,
                });
                setModalOpen(true);
              }}
            >
              {t('common.edit')}
            </Button>

            <Button
              size="small"
              danger
              disabled={s === 'locked'}
              onClick={() => {
                Modal.confirm({
                  title: t('workforce.deleteSchedule' as never),
                  onOk: () => handleAction(() => workforceOpsService.deleteDriverSchedule(row.id), t('workforce.scheduleDeleted' as never)),
                });
              }}
            >
              {t('common.delete')}
            </Button>
          </Space>
        );
      },
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      work_date: values.work_date.format('YYYY-MM-DD'),
      start_time: values.start_time.format('HH:mm'),
      end_time: values.end_time.format('HH:mm'),
    };

    await handleAction(
      () => editingId ? workforceOpsService.updateDriverSchedule(editingId, payload) : workforceOpsService.createDriverSchedule(payload),
      editingId ? t('notifications.updateSuccess' as never) : t('notifications.createSuccess' as never)
    );
    setModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card size="small" variant="borderless">
        <Form {...searchFormProps} layout="inline">
          <FormItemSelect
            name="office_id"
            label={t('offices.title' as never)}
            options={officeOptions}
            selectProps={officeSelectRest}
            style={{ minWidth: 200 }}
          />
          <FormItemSelect
            name="driver_id"
            label={t('drivers.title' as never)}
            options={driverOptions}
            selectProps={driverSelectRest}
            style={{ minWidth: 200 }}
          />
          <FormItemDatePicker name="work_date" label={t('workforce.workDate' as never)} />
          <Button type="primary" onClick={searchFormProps.form?.submit}>{t('common.filter')}</Button>
          <Button onClick={() => searchFormProps.form?.resetFields()}>{t('common.reset')}</Button>
          <Button type="primary" onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }} style={{ marginLeft: 'auto' }}>
            {t('common.create')}
          </Button>
        </Form>
      </Card>

      <Table {...tableProps} columns={columns} rowKey="id" />

      <Modal
        title={editingId ? t('common.edit') : t('common.create')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <FormItemSelect
                name="driver_id"
                label={t('drivers.title' as never)}
                options={driverOptions}
                selectProps={driverSelectRest}
                rules={[requiredRule(t('drivers.title' as never))]}
              />
            </Col>
            <Col span={12}>
              <FormItemSelect
                name="office_id"
                label={t('offices.title' as never)}
                options={officeOptions}
                selectProps={officeSelectRest}
                rules={[requiredRule(t('offices.title' as never))]}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormItemDatePicker name="work_date" label={t('workforce.workDate' as never)} rules={[requiredRule(t('workforce.workDate' as never))]} />
            </Col>
            <Col span={12}>
              <FormItemText name="shift_code" label={t('workforce.shift' as never)} rules={[requiredRule(t('workforce.shift' as never))]} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormItemDatePicker name="start_time" label={t('workforce.startTime' as never)} picker="time" format="HH:mm" rules={[requiredRule(t('workforce.startTime' as never))]} />
            </Col>
            <Col span={12}>
              <FormItemDatePicker name="end_time" label={t('workforce.endTime' as never)} picker="time" format="HH:mm" rules={[requiredRule(t('workforce.endTime' as never))]} />
            </Col>
          </Row>
          <FormItemSelect
            name="vehicle_id"
            label={t('vehicles.title' as never)}
            options={vehicleOptions}
            selectProps={vehicleSelectRest}
          />
          <FormItemText name="notes" label={t('common.notes')} />
        </Form>
      </Modal>
    </Space>
  );
};
