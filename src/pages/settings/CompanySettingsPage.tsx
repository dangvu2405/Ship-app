import { useEffect } from 'react';
import { App, Button, Card, Col, Descriptions, Form, Input, Result, Row, Select, Space, Spin, Tag } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useOne, useUpdate } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import type { Company } from '@/types';

import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { recordAuditIntent } from '@/lib/audit-action';

import React from 'react';
const useCompanyCodeCheckUnique = () => {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (endpoint: string, code: string, currentId?: number) =>
    new Promise<boolean>((resolve) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await api.get(endpoint, {
            params: { code, per_page: 5 },
            skipErrorToast: true,
          } as Parameters<typeof api.get>[1]);
          const list = (res.data as { data?: { data?: Array<{ id: number; code?: string }> } }).data?.data ?? [];
          const dup = list.find(
            (row) => row.code?.trim().toLowerCase() === code.trim().toLowerCase() && row.id !== currentId,
          );
          resolve(!dup);
        } catch {
          resolve(true);
        }
      }, 350);
    });
};

export function CompanySettingsPage() {
  const checkCompanyCodeUnique = useCompanyCodeCheckUnique();
  const { t } = useTranslation();
  const { currentTenantId } = useAuthStore();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const { modal, message } = App.useApp();

  const baseEndpoint = isSuperAdmin ? ENDPOINTS.adminCompanies.base : ENDPOINTS.companies.base;
  const resourceName = isSuperAdmin ? 'admin-companies' : 'companies';

  const { data, isLoading, error: detailError } = useOne<Company>({
    resource: resourceName,
    id: currentTenantId ?? 0,
    queryOptions: { enabled: currentTenantId != null },
  });

  const company = data?.data;
  const detailStatus = (detailError as { statusCode?: number; status?: number })?.statusCode ?? (detailError as { status?: number })?.status;

  const { mutateAsync: update, isLoading: saving } = useUpdate<Company>();

  useEffect(() => {
    if (company && editing) {
      form.setFieldsValue({
        name: company.name,
        code: company.code,
        tax_code: company.tax_code,
        address: company.address,
        phone: company.phone,
        email: company.email,
        status: company.status,
      });
    }
  }, [company, editing, form]);

  const handleSave = async (vals: Record<string, unknown>) => {
    if (!company) return;
    try {
      const previousStatus = company.status;
      const nextStatus = (vals as { status?: string }).status;
      await update({ resource: resourceName, id: company.id, values: vals });
      message.success(t('companies.companyUpdated'));
      if (nextStatus && nextStatus !== previousStatus) {
        recordAuditIntent({
          resource: 'companies',
          kind: nextStatus === 'inactive' ? 'lock' : 'update',
          recordId: company.id,
          meta: { from: previousStatus, to: nextStatus },
        });
      }
      setEditing(false);
    } catch (err) {
      if (!shouldShowLocalErrorToast(err)) return;
      message.error(getErrorMessage(err) ?? t('messages.saveError'));
    }
  };

  const confirmStatusChange = (nextStatus: 'active' | 'inactive') => {
    if (!company) return;
    modal.confirm({
      title: nextStatus === 'inactive' ? 'Vô hiệu hóa công ty?' : 'Kích hoạt công ty?',
      content: `${company.name} sẽ ${nextStatus === 'inactive' ? 'không thể' : 'có thể'} truy cập sau khi xác nhận.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: nextStatus === 'inactive' ? { danger: true } : undefined,
      onOk: async () => {
        try {
          if (isSuperAdmin) {
            await api.patch(ENDPOINTS.adminCompanies.status(company.id), { status: nextStatus });
          } else {
            await api.patch(ENDPOINTS.companies.status(company.id), { status: nextStatus });
          }
          recordAuditIntent({
            resource: 'companies',
            kind: nextStatus === 'inactive' ? 'lock' : 'update',
            recordId: company.id,
            meta: { from: company.status, to: nextStatus },
          });
          message.success('Đã cập nhật trạng thái');
        } catch (err) {
          message.error(getErrorMessage(err) ?? 'Cập nhật trạng thái thất bại');
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="enterprise-page" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="enterprise-page space-y-4">
        <PageHeader
          title={t('sidebar.companyConfig')}
          breadcrumb={[
            { label: t('dashboard.title'), path: ROUTES.dashboard },
            { label: t('sidebar.settings'), path: ROUTES.admin.settings.root },
            { label: t('sidebar.companyConfig') },
          ]}
        />
        <Card>
          {detailStatus === 403 ? (
            <Result status="403" title="403" subTitle={t('common.forbidden')} />
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              Không tìm thấy thông tin công ty. Vui lòng chọn tenant.
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.companyConfig')}
        description="Xem và chỉnh sửa thông tin công ty hiện tại"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.settings'), path: ROUTES.admin.settings.root },
          { label: t('sidebar.companyConfig') },
        ]}
        actions={
          editing ? (
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
              {t('common.save')}
            </Button>
          ) : (
            <Space>
              {company.status === 'active' ? (
                <Button danger onClick={() => confirmStatusChange('inactive')}>
                  Vô hiệu hóa
                </Button>
              ) : (
                <Button onClick={() => confirmStatusChange('active')}>Kích hoạt</Button>
              )}
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                {t('common.edit')}
              </Button>
            </Space>
          )
        }
      />

      <Card>
        {editing ? (
          <Form
            form={form}
            name="company-settings-form"
            layout="vertical"
            onFinish={(v) => void handleSave(v as Record<string, unknown>)}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label={t('companies.name')} rules={[{ required: true, message: 'Nhập tên công ty' }]}>
                  <Input placeholder={t('companies.namePlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="code"
                  label={t('companies.code')}
                  rules={[
                    { required: true, message: 'Nhập mã công ty' },
                    {
                      validator: async (_: unknown, value: string) => {
                        if (!value || value.trim().length === 0) return;
                        const ok = await checkCompanyCodeUnique(baseEndpoint, value.trim(), company.id);
                        if (!ok) throw new Error('Mã công ty đã tồn tại');
                      },
                    },
                  ]}
                >
                  <Input placeholder={t('companies.codePlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="tax_code" label={t('companies.taxCode')}>
                  <Input placeholder={t('companies.taxCodePlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="phone" label={t('companies.phone')}>
                  <Input placeholder={t('companies.phonePlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label={t('companies.email')}>
                  <Input type="email" placeholder={t('companies.emailPlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="status" label={t('common.status')}>
                  <Select
                    options={[
                      { value: 'active', label: t('common.active') },
                      { value: 'inactive', label: t('common.inactive') },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="address" label={t('companies.address')}>
                  <Input.TextArea rows={2} placeholder={t('companies.addressPlaceholder')} />
                </Form.Item>
              </Col>
            </Row>
            <Button onClick={() => setEditing(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>{t('common.save')}</Button>
          </Form>
        ) : (
          <Descriptions column={{ xs: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label={t('companies.name')}>{company.name}</Descriptions.Item>
            <Descriptions.Item label={t('companies.code')}>{company.code ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('companies.taxCode')}>{company.tax_code ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('companies.phone')}>{company.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('companies.email')}>{company.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <Tag color={company.status === 'active' ? 'green' : 'default'}>
                {company.status === 'active' ? t('common.active') : company.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('companies.address')} span={2}>
              {company.address ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}
