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
  Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTable, useSelect } from '@refinedev/antd';
import { useTranslation } from '@/hooks/useTranslation';
import workforceOpsService from '@/services/workforce-ops.service';
import type { OvertimeRequest, Driver, Company } from '@/types';
import { formatDate } from '@/utils/displayFormat';
import { requiredRule } from '@/utils/validation';
import {
  OT_STATUS_COLOR,
} from '@/pages/system/components/workforce-ops.constants';
import { StatusTag, DetailDescriptions } from '@/pages/system/components/workforce-ops-ui';
import { antdUtils } from '@/utils/antdGlobal';
import { FormItemSelect, FormItemDatePicker, FormItemText, FormItemNumber } from '@/components/form';

export const WorkforceOvertimeTab = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<OvertimeRequest | null>(null);

  const { tableProps, searchFormProps, tableQueryResult } = useTable<OvertimeRequest>({
    resource: 'overtime',
    onSearch: (values: any) => {
      return [
        { field: 'driver_id', operator: 'eq', value: values.driver_id },
        { field: 'status', operator: 'eq', value: values.status },
      ];
    },
  });

  const { selectProps: driverSelectProps } = useSelect<Driver>({
    resource: 'drivers',
    optionLabel: 'name',
  });

  const { selectProps: companySelectProps } = useSelect<Company>({
    resource: 'companies',
    optionLabel: 'name',
  });

  const { options: driverOptions = [], ...driverSelectRest } = driverSelectProps;
  const { options: companyOptions = [], ...companySelectRest } = companySelectProps;

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      antdUtils.getMessage().success(successMsg);
      tableQueryResult.refetch();
    } catch (err: any) {
      antdUtils.getMessage().error(err?.message || t('common.error'));
    }
  };

  const columns: ColumnsType<OvertimeRequest> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (_, row) => (row as { driver?: { name?: string } }).driver?.name || `#${row.driver_id}` },
    { title: t('common.date' as never), dataIndex: 'work_date', render: (v) => formatDate(v) },
    { title: t('workforce.otHours' as never), dataIndex: 'ot_hours' },
    { title: t('workforce.startTime' as never), dataIndex: 'start_time' },
    { title: t('workforce.endTime' as never), dataIndex: 'end_time' },
    { title: t('common.reason' as never), dataIndex: 'reason', ellipsis: true },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v} colorMap={OT_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => {
        const s = row.status;
        const canApprove = ['submitted', 'pending', 'draft'].includes(s);
        const canReject = ['submitted', 'pending', 'draft'].includes(s);
        return (
          <Space>
            <Button size="small" onClick={() => { setDetailData(row); setDetailOpen(true); }}>
              {t('common.view')}
            </Button>
            <Button
              size="small"
              disabled={!canApprove}
              onClick={() => handleAction(() => workforceOpsService.approveOvertime(row.id), t('workforce.overtimeApproved' as never))}
            >
              {t('common.approve' as never)}
            </Button>
            <Button
              size="small"
              danger
              disabled={!canReject}
              onClick={() => {
                Modal.confirm({
                  title: t('workforce.rejectOvertime' as never),
                  content: <Input.TextArea id="reject-reason-ot" placeholder={t('workforce.rejectReasonPlaceholder' as never)} />,
                  onOk: () => {
                    const reason = (document.getElementById('reject-reason-ot') as HTMLTextAreaElement).value;
                    return handleAction(() => workforceOpsService.rejectOvertime(row.id, reason), t('workforce.rejected' as never));
                  },
                });
              }}
            >
              {t('common.reject' as never)}
            </Button>
          </Space>
        );
      },
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await handleAction(
      () => workforceOpsService.createOvertime({
        ...values,
        work_date: values.work_date.format('YYYY-MM-DD'),
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss'),
      }),
      t('workforce.createOvertimeSuccess' as never)
    );
    setModalOpen(false);
    form.resetFields();
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
          <FormItemSelect
            name="status"
            label={t('common.status')}
            options={Object.keys(OT_STATUS_COLOR).map(k => ({ label: k, value: k }))}
            style={{ minWidth: 150 }}
          />
          <Button type="primary" onClick={searchFormProps.form?.submit}>{t('common.filter')}</Button>
          <Button onClick={() => searchFormProps.form?.resetFields()}>{t('common.reset')}</Button>
          <Button type="primary" onClick={() => { form.resetFields(); setModalOpen(true); }} style={{ marginLeft: 'auto' }}>
            {t('common.create')}
          </Button>
        </Form>
      </Card>

      <Table {...tableProps} columns={columns} rowKey="id" />

      <Modal
        title={t('common.create')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <FormItemSelect
            name="driver_id"
            label={t('drivers.title' as never)}
            options={driverOptions}
            selectProps={driverSelectRest}
            rules={[requiredRule(t('drivers.title' as never))]}
          />
          <FormItemSelect
            name="company_id"
            label={t('companies.title' as never)}
            options={companyOptions}
            selectProps={companySelectRest}
            rules={[requiredRule(t('companies.title' as never))]}
          />
          <FormItemDatePicker name="work_date" label={t('common.date' as never)} rules={[requiredRule(t('common.date' as never))]} />
          <Row gutter={16}>
            <Col span={12}>
              <FormItemDatePicker name="start_time" label={t('workforce.startTime' as never)} picker="time" format="HH:mm:ss" rules={[requiredRule(t('workforce.startTime' as never))]} />
            </Col>
            <Col span={12}>
              <FormItemDatePicker name="end_time" label={t('workforce.endTime' as never)} picker="time" format="HH:mm:ss" rules={[requiredRule(t('workforce.endTime' as never))]} />
            </Col>
          </Row>
          <FormItemNumber name="ot_hours" label={t('workforce.otHours' as never)} rules={[requiredRule(t('workforce.otHours' as never))]} />
          <FormItemText name="reason" label={t('common.reason' as never)} rules={[requiredRule(t('common.reason' as never))]} />
        </Form>
      </Modal>

      <Modal
        title={t('workforce.overtimeRequest' as never)}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {detailData && <DetailDescriptions kind="overtime" data={detailData as unknown as Record<string, unknown>} />}
      </Modal>
    </Space>
  );
};
