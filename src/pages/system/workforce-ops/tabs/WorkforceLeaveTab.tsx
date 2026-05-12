import { useState, useEffect } from 'react';
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
import type { LeaveRequest, Driver } from '@/types';
import { formatDate } from '@/utils/displayFormat';
import { requiredRule } from '@/utils/validation';
import {
  LEAVE_STATUS_COLOR,
} from '@/pages/system/components/workforce-ops.constants';
import { StatusTag, DetailDescriptions } from '@/pages/system/components/workforce-ops-ui';
import { antdUtils } from '@/utils/antdGlobal';
import { FormItemSelect, FormItemDatePicker, FormItemText, FormItemNumber } from '@/components/form';

export const WorkforceLeaveTab = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<LeaveRequest | null>(null);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<Array<{ label: string; value: number }>>([]);

  const { tableProps, searchFormProps, tableQueryResult } = useTable<LeaveRequest>({
    resource: 'leave-requests',
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
  const { options: driverOptions = [], ...driverSelectRest } = driverSelectProps;

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const r = await workforceOpsService.listLeaveTypes();
        setLeaveTypeOptions((r.data || []).map((item) => ({ label: item.name || `Type ${item.id}`, value: item.id })));
      } catch {
        // no-op
      }
    };
    void loadLeaveTypes();
  }, []);

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      antdUtils.getMessage().success(successMsg);
      tableQueryResult.refetch();
    } catch (err: any) {
      antdUtils.getMessage().error(err?.message || t('common.error'));
    }
  };

  const columns: ColumnsType<LeaveRequest> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (_, row) => (row as { driver?: { name?: string } }).driver?.name || `#${row.driver_id}` },
    { title: t('workforce.leaveType' as never), dataIndex: 'leave_type', render: (_, row) => (row as { leave_type?: { name?: string } }).leave_type?.name || row.leave_type_id },
    { title: t('workforce.fromDate' as never), dataIndex: 'from_date', render: (v) => formatDate(v) },
    { title: t('workforce.toDate' as never), dataIndex: 'to_date', render: (v) => formatDate(v) },
    { title: t('workforce.totalDays' as never), dataIndex: 'total_days' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v} colorMap={LEAVE_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => {
        const s = row.status;
        const canApprove = ['pending', 'submitted'].includes(s);
        const canReject = ['pending', 'submitted'].includes(s);
        const canCancel = ['pending', 'submitted', 'approved'].includes(s);
        return (
          <Space>
            <Button size="small" onClick={() => { setDetailData(row); setDetailOpen(true); }}>
              {t('common.view')}
            </Button>
            <Button
              size="small"
              disabled={!canApprove}
              onClick={() => handleAction(() => workforceOpsService.approveLeave(row.id), t('workforce.leaveApproved' as never))}
            >
              {t('common.approve' as never)}
            </Button>
            <Button
              size="small"
              danger
              disabled={!canReject}
              onClick={() => {
                Modal.confirm({
                  title: t('workforce.rejectLeave' as never),
                  content: <Input.TextArea id="reject-reason" placeholder={t('workforce.rejectReasonPlaceholder' as never)} />,
                  onOk: () => {
                    const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement).value;
                    return handleAction(() => workforceOpsService.rejectLeave(row.id, reason), t('workforce.rejected' as never));
                  },
                });
              }}
            >
              {t('common.reject' as never)}
            </Button>
            <Button
              size="small"
              disabled={!canCancel}
              onClick={() => handleAction(() => workforceOpsService.cancelLeave(row.id), t('workforce.leaveCancelled' as never))}
            >
              {t('common.cancel' as never)}
            </Button>
          </Space>
        );
      },
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await handleAction(
      () => workforceOpsService.createLeave({
        ...values,
        from_date: values.from_date.format('YYYY-MM-DD'),
        to_date: values.to_date.format('YYYY-MM-DD'),
      }),
      t('workforce.createLeaveSuccess' as never)
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
            options={Object.keys(LEAVE_STATUS_COLOR).map(k => ({ label: k, value: k }))}
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
          <FormItemSelect name="leave_type_id" label={t('workforce.leaveType' as never)} options={leaveTypeOptions} rules={[requiredRule(t('workforce.leaveType' as never))]} />
          <Row gutter={16}>
            <Col span={12}>
              <FormItemDatePicker name="from_date" label={t('workforce.fromDate' as never)} rules={[requiredRule(t('workforce.fromDate' as never))]} />
            </Col>
            <Col span={12}>
              <FormItemDatePicker name="to_date" label={t('workforce.toDate' as never)} rules={[requiredRule(t('workforce.toDate' as never))]} />
            </Col>
          </Row>
          <FormItemNumber name="total_days" label={t('workforce.totalDays' as never)} rules={[requiredRule(t('workforce.totalDays' as never))]} />
          <FormItemText name="reason" label={t('common.reason' as never)} rules={[requiredRule(t('common.reason' as never))]} />
        </Form>
      </Modal>

      <Modal
        title={t('workforce.leaveRequest' as never)}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {detailData && <DetailDescriptions kind="leave" data={detailData as unknown as Record<string, unknown>} />}
      </Modal>
    </Space>
  );
};
