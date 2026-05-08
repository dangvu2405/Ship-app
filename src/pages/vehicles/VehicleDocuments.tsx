import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { PlusOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import vehicleService from '@/services/vehicle.service';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { publicFileUploadToUrl } from '@/utils/publicFileUpload';
import type { VehicleDocument } from '@/types';
import type { ExpiringVehicleDocumentRow } from '@/types/api/vehicle';
import { formatDate } from '@/utils/displayFormat';

const DOC_TYPES = [
  'registration',
  'inspection',
  'liability_insurance',
  'vehicle_insurance',
  'badge',
  'photo',
  'other',
] as const;

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return dayjs(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day');
}

export interface VehicleDocumentsProps {
  vehicleId: number;
}

export function VehicleDocuments({ vehicleId }: VehicleDocumentsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const documentsQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'documents'],
    queryFn: async () => {
      const res = await vehicleService.getDocuments(vehicleId, { per_page: 200 });
      return res.data.data;
    },
  });

  const expiringQuery = useQuery({
    queryKey: ['vehicles', 'expiring-documents'],
    queryFn: async () => {
      const res = await vehicleService.getExpiringDocuments({ per_page: 500 });
      return res.data.data.filter((row) => row.vehicle_id === vehicleId);
    },
  });

  const expiringById = useMemo(() => {
    const m = new Map<number, ExpiringVehicleDocumentRow>();
    for (const row of expiringQuery.data ?? []) {
      m.set(row.id, row);
    }
    return m;
  }, [expiringQuery.data]);

  const createMutation = useMutation({
    mutationFn: async (values: {
      doc_type: string;
      doc_name: string;
      doc_number?: string;
      issued_date?: string;
      expiry_date?: string;
      issuer?: string;
      alert_before_days?: number;
      file_url?: string;
    }) => vehicleService.createDocument(vehicleId, values),
    onSuccess: () => {
      message.success(t('notifications.createSuccess', { item: t('vehicles.documentsTitle') }));
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'documents'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicles', 'expiring-documents'] });
    },
    onError: (error) => {
      if (!shouldShowLocalErrorToast(error)) return;
      message.error(getErrorMessage(error) || t('notifications.createError', { item: t('vehicles.documentsTitle') }));
    },
  });

  const columns: ColumnsType<VehicleDocument> = useMemo(
    () => [
      {
        title: t('vehicles.docName'),
        dataIndex: 'doc_name',
        key: 'doc_name',
      },
      {
        title: t('vehicles.docNumber'),
        dataIndex: 'doc_number',
        key: 'doc_number',
        render: (v: string | null) => v ?? '—',
      },
      {
        title: t('vehicles.issuedDate'),
        dataIndex: 'issued_date',
        key: 'issued_date',
        render: (v: string) => formatDate(v) ?? '—',
      },
      {
        title: t('vehicles.expiryDate'),
        dataIndex: 'expiry_date',
        key: 'expiry_date',
        render: (v: string | null, row) => {
          const expiring = expiringById.get(row.id);
          const d = expiring?.days_remaining ?? daysUntil(v);
          const threshold = row.alert_before_days ?? 30;
          const inExpiringFeed = Boolean(expiring);
          const soon =
            v != null && d != null && d >= 0 && d < threshold;
          const showWarn = inExpiringFeed || soon;
          return (
            <Space>
              {v ? formatDate(v) : '—'}
              {showWarn && d != null && (
                <Tag icon={<WarningOutlined />} color="error">
                  {t('vehicles.expiresInDays', { count: d })}
                </Tag>
              )}
            </Space>
          );
        },
      },
      {
        title: t('vehicles.issuer'),
        dataIndex: 'issuer',
        key: 'issuer',
        render: (v: string | null) => v ?? '—',
      },
      {
        title: t('vehicles.file'),
        dataIndex: 'file_url',
        key: 'file_url',
        render: (url: string | null) =>
          url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {t('common.view')}
            </a>
          ) : (
            '—'
          ),
      },
    ],
    [t, expiringById],
  );

  const submitCreate = async () => {
    const values = await form.validateFields();
    let file_url = values.file_url as string | undefined;
    const uploading = fileList.some((f) => f.status === 'uploading');
    if (uploading) {
      message.warning(t('vehicles.vehiclePhotoWaitUpload'));
      return;
    }
    if (!file_url && fileList.length) {
      const f = fileList[0];
      const fromResponse = f.response as { data?: { url?: string } } | undefined;
      file_url = fromResponse?.data?.url ?? f.url;
    }
    const issuedDate =
      values.issued_date && dayjs.isDayjs(values.issued_date)
        ? values.issued_date.format('YYYY-MM-DD')
        : (values.issued_date as string | undefined);
    const expiryDate =
      values.expiry_date && dayjs.isDayjs(values.expiry_date)
        ? values.expiry_date.format('YYYY-MM-DD')
        : (values.expiry_date as string | undefined);
    await createMutation.mutateAsync({
      doc_type: values.doc_type,
      doc_name: values.doc_name,
      doc_number: values.doc_number,
      issued_date: issuedDate,
      expiry_date: expiryDate,
      issuer: values.issuer,
      alert_before_days: values.alert_before_days,
      file_url,
    });
  };

  return (
    <>
      <Space className="mb-3" wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('vehicles.addDocument')}
        </Button>
      </Space>
      <Table<VehicleDocument>
        rowKey="id"
        loading={documentsQuery.isLoading}
        dataSource={documentsQuery.data ?? []}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('vehicles.documentsEmpty') }}
      />

      <Modal
        title={t('vehicles.addDocument')}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setFileList([]);
        }}
        onOk={() => void submitCreate()}
        confirmLoading={createMutation.isPending}
        destroyOnHidden
      >
        <Form name="vehicle-document-form" form={form} layout="vertical">
          <Form.Item
            name="doc_type"
            label={t('vehicles.docTypeLabel')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.docTypeLabel') }) }]}
          >
            <Select
              options={DOC_TYPES.map((d) => ({ value: d, label: t(`vehicles.docType.${d}`) }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="doc_name"
            label={t('vehicles.docName')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.docName') }) }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="doc_number" label={t('vehicles.docNumber')}>
            <Input />
          </Form.Item>
          <Form.Item name="issued_date" label={t('vehicles.issuedDate')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={t('vehicles.issuedDate')} />
          </Form.Item>
          <Form.Item name="expiry_date" label={t('vehicles.expiryDate')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={t('vehicles.expiryDate')} />
          </Form.Item>
          <Form.Item name="issuer" label={t('vehicles.issuer')}>
            <Input />
          </Form.Item>
          <Form.Item name="alert_before_days" label={t('vehicles.alertBeforeDays')} initialValue={30}>
            <InputNumber min={1} max={365} className="w-full" />
          </Form.Item>
          <Form.Item label={t('vehicles.scanFile')}>
            <Upload
              maxCount={1}
              fileList={fileList}
              customRequest={(options) => {
                void publicFileUploadToUrl({
                  ...options,
                  onSuccess: (body, xhr) => {
                    options.onSuccess?.(body, xhr);
                  },
                  onError: (err) => options.onError?.(err),
                });
              }}
              onChange={({ fileList: fl }) => setFileList(fl)}
            >
              <Button>{t('vehicles.uploadScan')}</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
