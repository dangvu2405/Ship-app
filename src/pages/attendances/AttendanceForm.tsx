import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { useTranslation } from '@/hooks/useTranslation';
import type { Attendance, Employee } from '@/types';

interface AttendanceFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Attendance>;
}

export function AttendanceForm(props: AttendanceFormProps) {
  void props;
  const { t } = useTranslation();
  const { data: empData, isLoading } = useList<Employee>({
    resource: 'employees',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const employeeOptions = (empData?.data ?? []).map((e) => ({
    label: `${e.code} — ${e.name}`,
    value: e.id,
  }));

  const statusOptions = [
    { label: t('attendances.statusPresent'), value: 'present' },
    { label: t('attendances.statusAbsent'), value: 'absent' },
    { label: t('attendances.statusLate'), value: 'late' },
    { label: t('attendances.statusHalfDay'), value: 'half_day' },
    { label: t('attendances.statusLeave'), value: 'leave' },
  ];

  return (
    <>
      <FormItemSelect
        name="employee_id"
        label={t('attendances.employee')}
        required
        options={employeeOptions}
        loading={isLoading}
        showSearch
        selectProps={{ optionFilterProp: 'label' }}
        rules={[{ required: true, message: t('validation.required', { field: t('attendances.employee') }) }]}
      />
      <FormItemText name="date" label={t('attendances.date')} type="date" required rules={[{ required: true, message: t('validation.required', { field: t('attendances.date') }) }]} />
      <FormItemText name="check_in" label={t('attendances.checkIn')} placeholder="08:00" />
      <FormItemText name="check_out" label={t('attendances.checkOut')} placeholder="17:00" />
      <FormItemNumber name="work_hours" label={t('attendances.workHours')} min={0} />
      <FormItemNumber name="overtime_hours" label={t('attendances.overtimeHours')} min={0} />
      <FormItemSelect
        name="status"
        label={t('common.status')}
        required
        options={statusOptions}
        rules={[{ required: true, message: t('validation.required', { field: t('common.status') }) }]}
      />
    </>
  );
}
