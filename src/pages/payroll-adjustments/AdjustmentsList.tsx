import React, { useState } from 'react';
import {
  List,
  useTable,
  EditButton,
  DeleteButton,
  useModalForm,
} from '@refinedev/antd';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  Typography,
} from 'antd';
import { useSelect, useUpdate } from '@refinedev/core';
import { PayrollAdjustment, Employee, Payroll } from '@/types';
import toast from 'react-hot-toast';
import payrollAdjustmentService from '@/services/payroll-adjustment.service';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { formatMoney } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const TYPE_LABELS: Record<string, string> = {
  allowance: 'Phụ cấp',
  deduction: 'Khấu trừ',
};

export const AdjustmentsList: React.FC = () => {
  const { tableProps } = useTable<PayrollAdjustment>({
    syncWithLocation: true,
  });

  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Form Create/Edit
  const { selectProps: employeeSelectProps } = useSelect<Employee>({
    resource: 'employees',
    optionLabel: 'name',
    optionValue: 'id',
  });

  const { selectProps: payrollSelectProps } = useSelect<Payroll>({
    resource: 'payrolls',
    optionLabel: 'id', // Maybe show "Tháng X/Y" but let's keep ID for now or format in render
    optionValue: 'id',
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm<PayrollAdjustment>({
    action: 'create',
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm<PayrollAdjustment>({
    action: 'edit',
  });


  // Action: Approve / Reject
  const [actionRecord, setActionRecord] = useState<PayrollAdjustment | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectForm] = Form.useForm();

  const handleApprove = async (record: PayrollAdjustment) => {
    if (record.amount > 5000000 && !isAdmin) {
      toast.error('Chỉ admin mới được duyệt mức điều chỉnh trên 5,000,000 VND.');
      return;
    }
    
    try {
      await payrollAdjustmentService.approve(record.id);
      toast.success('Đã duyệt biểu điều chỉnh');
      tableProps.onChange?.({ current: 1 } as any, {}, {}, { currentDataSource: [] });
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) || 'Duyệt thất bại');
    }
  };

  const handleReject = async (values: { reason: string }) => {
    if (!actionRecord) return;
    try {
      await payrollAdjustmentService.reject(actionRecord.id, values.reason);
      toast.success('Đã từ chối biểu điều chỉnh');
      setRejectOpen(false);
      tableProps.onChange?.({ current: 1 } as any, {}, {}, { currentDataSource: [] });
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      toast.error(getErrorMessage(err) || 'Từ chối thất bại');
    }
  };

  return (
    <List
      createButtonProps={{ onClick: () => showCreateModal() }}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={80} />
        <Table.Column title="Bảng lương" dataIndex="payroll_id" render={(v) => `Kỳ lương #${v}`} />
        <Table.Column 
           title="Nhân viên" 
           dataIndex="employee" 
           render={(_, record: PayrollAdjustment) => record.employee?.name || `NV #${record.employee_id}`} 
        />
        <Table.Column 
          title="Loại" 
          dataIndex="type" 
          render={(val) => <Tag color={val === 'deduction' ? 'red' : 'green'}>{TYPE_LABELS[val]}</Tag>} 
        />
        <Table.Column 
          title="Số tiền" 
          dataIndex="amount" 
          render={(val) => <strong>{formatMoney(val || 0, { withCurrency: true })}</strong>} 
        />
        <Table.Column title="Lý do" dataIndex="description" />
        <Table.Column 
          title="Trạng thái" 
          dataIndex="status" 
          render={(val) => <Tag color={STATUS_COLORS[val]}>{STATUS_LABELS[val]}</Tag>} 
        />
        <Table.Column<PayrollAdjustment>
          title="Hành động"
          align="center"
          width={250}
          render={(_, record) => (
            <Space>
              {record.status === 'pending' && (
                <>
                  <EditButton hideText size="small" onClick={() => showEditModal(record.id)} />
                  <DeleteButton hideText size="small" recordItemId={record.id} />
                  <Button size="small" type="primary" onClick={() => handleApprove(record)}>
                    Duyệt
                  </Button>
                  <Button size="small" danger onClick={() => { setActionRecord(record); rejectForm.resetFields(); setRejectOpen(true); }}>
                    Từ chối
                  </Button>
                </>
              )}
            </Space>
          )}
        />
      </Table>

      {/* CREATE MODAL */}
      <Modal {...createModalProps} title="Thêm Điều Chỉnh Lương">
        <Form {...createFormProps} layout="vertical">
          <Form.Item name="payroll_id" label="Kỳ lương (Payroll ID)" rules={[{ required: true }]}>
            <Select {...payrollSelectProps} />
          </Form.Item>
          <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
             <Select {...employeeSelectProps} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="type" label="Loại điều chỉnh" rules={[{ required: true }]}>
            <Select options={[{ label: 'Phụ cấp', value: 'allowance' }, { label: 'Khấu trừ', value: 'deduction' }]} />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Diễn giải" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal {...editModalProps} title="Sửa Điều Chỉnh">
        <Form {...editFormProps} layout="vertical">
          <Form.Item name="type" label="Loại điều chỉnh" rules={[{ required: true }]}>
            <Select options={[{ label: 'Phụ cấp', value: 'allowance' }, { label: 'Khấu trừ', value: 'deduction' }]} />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Diễn giải" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        title="Từ chối điều chỉnh lương"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => rejectForm.submit()}
        okText="Xác nhận"
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Nhập lý do từ chối khoản {TYPE_LABELS[actionRecord?.type || '']} của nhân viên 
          #{actionRecord?.employee_id} ({formatMoney(actionRecord?.amount || 0, { withCurrency: true })})
        </Typography.Text>

        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
