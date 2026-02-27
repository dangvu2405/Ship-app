/**
 * Example: Companies page using BaseTable
 * This is an example showing how to use BaseTable component
 */

import { useState } from 'react';
import { useNavigation, useCreate, useUpdate } from '@refinedev/core';
import { List, useTable, CreateButton } from '@refinedev/antd';
import { Space, Input, Button, Tag, Modal, Form, message, Typography } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { BaseTable, BaseTableColumn } from '@/components/table';
import { Company } from '@/types';
import { CompanyForm } from './CompanyForm';

const { Title } = Typography;

export const CompaniesExample = () => {
  const { show } = useNavigation();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const { mutate: createCompany } = useCreate<Company>();
  const { mutate: updateCompany } = useUpdate<Company>();

  const { tableProps, searchFormProps } = useTable<Company>({
    resource: 'companies',
    pagination: {
      pageSize: 10,
    },
    sorters: {
      initial: [
        {
          field: 'id',
          order: 'desc',
        },
      ],
    },
  });

  // Delete is handled by BaseTable's useRefineDelete
  // const handleDelete = () => {
  //   Modal.confirm({
  //     title: 'Delete Company',
  //     content: 'Are you sure you want to delete this company?',
  //     okText: 'Yes, Delete',
  //     okType: 'danger',
  //     cancelText: 'Cancel',
  //     onOk: () => {
  //       // Delete will be handled by BaseTable's useRefineDelete
  //     },
  //   });
  // };

  const handleEdit = (record: Company) => {
    setEditingCompany(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCompany) {
        updateCompany(
          {
            resource: 'companies',
            id: editingCompany.id,
            values: values as Partial<Company>,
          },
          {
            onSuccess: () => {
              message.success('Company updated successfully');
              setIsModalVisible(false);
              form.resetFields();
              setEditingCompany(null);
            },
            onError: () => {
              message.error('Failed to update company');
            },
          }
        );
      } else {
        createCompany(
          {
            resource: 'companies',
            values: values as Partial<Company>,
          },
          {
            onSuccess: () => {
              message.success('Company created successfully');
              setIsModalVisible(false);
              form.resetFields();
              setEditingCompany(null);
            },
            onError: () => {
              message.error('Failed to create company');
            },
          }
        );
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingCompany(null);
  };

  const columns: BaseTableColumn<Company>[] = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string, record: Company) => (
        <Button
          type="link"
          onClick={() => show('companies', record.id)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Tax Code',
      dataIndex: 'tax_code',
      key: 'tax_code',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'active' ? 'green' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <List
      headerProps={{
        title: <Title level={3}>Companies</Title>,
        extra: (
          <CreateButton
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Add Company
          </CreateButton>
        ),
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Search Form */}
        <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="name">
            <Input
              placeholder="Search by name"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 250 }}
            />
          </Form.Item>
          <Form.Item name="code">
            <Input
              placeholder="Search by code"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
          </Form.Item>
        </Form>

        {/* BaseTable - Simplified! */}
        <BaseTable<Company>
          {...tableProps}
          dataSource={tableProps.dataSource ? [...tableProps.dataSource] : undefined}
          loading={typeof tableProps.loading === 'boolean' ? tableProps.loading : undefined}
          rowKey={!tableProps.rowKey 
            ? 'id'
            : typeof tableProps.rowKey === 'string' 
              ? tableProps.rowKey 
              : (record: Company) => {
                  const key = (tableProps.rowKey as (record: Company) => string | number)(record);
                  return typeof key === 'string' ? key : String(key);
                }}
          columns={columns}
          resource="companies"
          showActions
          onEdit={handleEdit}
          scroll={{ x: 1000 }}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} companies`,
          }}
        />
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCompany ? 'Edit Company' : 'Create Company'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingCompany ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <CompanyForm form={form} company={editingCompany} />
      </Modal>
    </List>
  );
};
