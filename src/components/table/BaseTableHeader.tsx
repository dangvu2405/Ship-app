import { Space, Typography, Form, Button, Input, Select } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import { CreateButton } from '@refinedev/antd';
import type { BaseTableHeaderProps } from './types';

const { Title, Text } = Typography;

/**
 * BaseTableHeader - Header component for tables with title, actions, and search
 * 
 * @example Basic usage
 * ```tsx
 * <BaseTableHeader
 *   title="Companies"
 *   description="Manage your companies"
 *   onCreate={() => setIsModalVisible(true)}
 * />
 * ```
 * 
 * @example With search
 * ```tsx
 * <BaseTableHeader
 *   title="Companies"
 *   searchFields={[
 *     { name: 'name', placeholder: 'Search by name' },
 *     { name: 'code', placeholder: 'Search by code' }
 *   ]}
 *   searchFormProps={searchFormProps}
 * />
 * ```
 */
export const BaseTableHeader = ({
  title,
  description,
  breadcrumb,
  actions,
  onCreate,
  createButtonText = 'Create',
  createButtonIcon = <PlusOutlined />,
  showCreateButton = true,
  onRefresh,
  showRefreshButton = false,
  onExport,
  showExportButton = false,
  exportButtonText = 'Export',
  searchFields,
  searchFormProps,
  showSearch = false,
  searchLayout = 'inline',
  extra,
  className,
  style,
}: BaseTableHeaderProps) => {
  return (
    <div className={className} style={style}>
      {/* Breadcrumb */}
      {breadcrumb && (
        <div style={{ marginBottom: 16 }}>
          {breadcrumb}
        </div>
      )}

      {/* Title and Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 16 
      }}>
        <div>
          {typeof title === 'string' ? (
            <Title level={3} style={{ margin: 0 }}>
              {title}
            </Title>
          ) : (
            title
          )}
          {description && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {description}
            </Text>
          )}
        </div>

        {/* Actions */}
        {(actions || showCreateButton || showRefreshButton || showExportButton) && (
          <Space>
            {actions}
            
            {showRefreshButton && (
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
              >
                Refresh
              </Button>
            )}

            {showExportButton && (
              <Button
                icon={<ExportOutlined />}
                onClick={onExport}
              >
                {exportButtonText}
              </Button>
            )}

            {showCreateButton && onCreate && (
              <CreateButton
                icon={createButtonIcon}
                onClick={onCreate}
              >
                {createButtonText}
              </CreateButton>
            )}

            {showCreateButton && !onCreate && (
              <CreateButton icon={createButtonIcon}>
                {createButtonText}
              </CreateButton>
            )}

            {extra}
          </Space>
        )}
      </div>

      {/* Search Form */}
      {showSearch && searchFields && searchFields.length > 0 && searchFormProps && (
        <Form
          {...searchFormProps}
          layout={searchLayout}
          style={{ marginBottom: 16 }}
        >
          {searchFields.map((field) => {
            if (field.type === 'select') {
              return (
                <Form.Item key={field.name} name={field.name}>
                  <Select
                    placeholder={field.placeholder || `Select ${field.name}`}
                    allowClear
                    style={{ width: field.width || 200 }}
                    options={field.options}
                    showSearch={field.showSearch}
                    filterOption={field.filterOption}
                  />
                </Form.Item>
              );
            }

            return (
              <Form.Item key={field.name} name={field.name}>
                <Input
                  placeholder={field.placeholder || `Search by ${field.name}`}
                  prefix={field.showSearchIcon !== false ? <SearchOutlined /> : undefined}
                  allowClear
                  style={{ width: field.width || 250 }}
                  {...field.inputProps}
                />
              </Form.Item>
            );
          })}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
          </Form.Item>

          {searchFormProps?.onReset && (
            <Form.Item>
              <Button onClick={() => {
                if (searchFormProps && searchFormProps.onReset) {
                  const form = searchFormProps.form;
                  if (form) {
                    form.resetFields();
                  }
                }
              }}>
                Reset
              </Button>
            </Form.Item>
          )}
        </Form>
      )}
    </div>
  );
};
