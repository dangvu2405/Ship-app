import { useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useInvalidate } from '@refinedev/core';
import type { HttpError } from '@refinedev/core';
import { useModalForm, useTable } from '@refinedev/antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import costService from '@/services/cost.service';
import type { TripCost } from '@/types/domain/cost';
import { TripCostStatuses } from '@/types/domain/cost';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrencyVND } from '@/utils/format';
import { useCostValidation, validateCostBeforeSubmit } from '@/hooks/useCostValidation';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { notifyErrorOnce } from '@/utils/errorToast';

type TripCostFormValues = {
  cost_category_id: number;
  amount: number;
  description?: string;
  incurred_date: dayjs.Dayjs;
  norm_amount?: number | null;
};

export interface TripCostsTabProps {
  tripId: number;
}

export function TripCostsTab({ tripId }: TripCostsTabProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const invalidate = useInvalidate();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);

  const { data: categoriesResult, isLoading: categoriesLoading } = useQuery({
    queryKey: ['cost-categories', 'active'],
    queryFn: () => costService.listCostCategories({ per_page: 200 }),
  });

  const categories = useMemo(() => categoriesResult?.data ?? [], [categoriesResult?.data]);

  const { tableProps, tableQuery } = useTable<TripCost>({
    resource: 'trip-costs',
    meta: { tripId },
    pagination: { pageSize: 10 },
    queryOptions: {
      enabled: Number.isFinite(tripId),
    },
  });

  const { modalProps, formProps, form, show, close } = useModalForm<TripCost, HttpError, TripCostFormValues>({
    resource: 'trip-costs',
    action: 'create',
    meta: { tripId },
    redirect: false,
    autoSubmitClose: true,
    warnWhenUnsavedChanges: false,
    onMutationSuccess: () => {
      void invalidate({ resource: 'trip-costs', invalidates: ['list'] });
      setReceiptFile(null);
      setUploadList([]);
      message.success(t('notifications.createSuccess', { item: t('costManagement.tripCost') }));
    },
    onMutationError: (error) => {
      if (shouldShowLocalErrorToast(error)) {
        notifyErrorOnce('trip-cost-create', error, {
          fallbackMessage: getErrorMessage(error) || t('notifications.createError', { item: t('costManagement.tripCost') }),
        });
      }
    },
  });

  const categoryId = Form.useWatch('cost_category_id', form);
  const amountWatch = Form.useWatch('amount', form);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const validation = useCostValidation(selectedCategory, amountWatch ?? null, Boolean(receiptFile));

  const mergedFormProps = {
    ...formProps,
    onFinish: async (values: TripCostFormValues) => {
      const i18nKey = validateCostBeforeSubmit(validation);
      if (i18nKey) {
        message.warning(t(i18nKey));
        throw new Error('validation');
      }
      if (!formProps.onFinish) return;
      await formProps.onFinish({
        ...values,
        incurred_date: values.incurred_date.format('YYYY-MM-DD'),
        receipt_file: receiptFile,
      } as never);
    },
  };

  const columns: ColumnsType<TripCost> = useMemo(
    () => [
      {
        title: t('costManagement.colCategory'),
        key: 'category',
        render: (_: unknown, row) => row.cost_category?.name ?? `#${row.cost_category_id}`,
      },
      {
        title: t('costManagement.colAmount'),
        dataIndex: 'amount',
        align: 'right',
        render: (v: number) => formatCurrencyVND(v),
      },
      {
        title: t('costManagement.colNorm'),
        dataIndex: 'norm_amount',
        align: 'right',
        render: (v: number | null | undefined) => formatCurrencyVND(v),
      },
      {
        title: t('costManagement.colStatus'),
        dataIndex: 'status',
        render: (s: string) => (
          <Tag
            color={
              s === TripCostStatuses.approved
                ? 'success'
                : s === TripCostStatuses.rejected
                  ? 'error'
                  : 'warning'
            }
          >
            {s === TripCostStatuses.pending
              ? t('costManagement.costStatusPending')
              : s === TripCostStatuses.approved
                ? t('costManagement.costStatusApproved')
                : t('costManagement.costStatusRejected')}
          </Tag>
        ),
      },
      {
        title: t('costManagement.colDate'),
        dataIndex: 'incurred_date',
        width: 120,
      },
      {
        title: t('costManagement.colReceipt'),
        key: 'receipt',
        width: 88,
        render: (_: unknown, row) =>
          row.receipt_file_url ? (
            <Image src={row.receipt_file_url} alt="" width={48} height={48} style={{ objectFit: 'cover' }} />
          ) : (
            '—'
          ),
      },
    ],
    [t],
  );

  const openCreate = () => {
    setReceiptFile(null);
    setUploadList([]);
    show();
    form.setFieldsValue({
      incurred_date: dayjs(),
      amount: undefined,
      cost_category_id: undefined,
      description: undefined,
      norm_amount: undefined,
    });
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div className="flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('costManagement.addCost')}
        </Button>
      </div>

      {tableQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Table<TripCost> {...tableProps} rowKey="id" columns={columns} scroll={{ x: 720 }} />
      )}

      <Modal
        {...modalProps}
        title={t('costManagement.addCost')}
        onCancel={() => {
          close();
          setReceiptFile(null);
          setUploadList([]);
        }}
        okText={t('common.submit')}
      >
        {validation.exceedsThreshold && (
          <Alert
            type="warning"
            showIcon
            className="mb-3"
            message={t('costManagement.thresholdWarning', {
              threshold: formatCurrencyVND(validation.threshold ?? 0),
            })}
          />
        )}
        <Form {...mergedFormProps} layout="vertical">
          <Form.Item
            label={t('costManagement.fieldCategory')}
            name="cost_category_id"
            rules={[{ required: true, message: t('costManagement.categoryRequired') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={categoriesLoading}
              placeholder={t('costManagement.categoryPlaceholder')}
              options={categories
                .filter((c) => c.is_active !== false && c.is_active !== 0)
                .map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
            />
          </Form.Item>
          <Form.Item
            label={t('costManagement.fieldAmount')}
            name="amount"
            rules={[{ required: true, message: t('costManagement.amountRequired') }]}
          >
            <InputNumber<number> className="w-full" min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('costManagement.fieldNormOptional')} name="norm_amount">
            <InputNumber<number> className="w-full" min={0} />
          </Form.Item>
          <Form.Item
            label={t('costManagement.fieldDate')}
            name="incurred_date"
            rules={[{ required: true, message: t('costManagement.dateRequired') }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label={t('costManagement.fieldDescription')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label={t('costManagement.fieldReceipt')}
            required={validation.requiresReceipt}
            validateStatus={validation.receiptMissing ? 'warning' : undefined}
            help={validation.requiresReceipt ? t('costManagement.receiptHelp') : undefined}
          >
            <Upload
              fileList={uploadList}
              beforeUpload={(file) => {
                setReceiptFile(file);
                setUploadList([
                  {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                  },
                ]);
                return false;
              }}
              onRemove={() => {
                setReceiptFile(null);
                setUploadList([]);
              }}
              maxCount={1}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>{t('costManagement.uploadReceipt')}</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
