import React from 'react';
import { Button, DatePicker, Input, Row, Col, Form } from 'antd';
import { ReportFilter } from '../types';

const { RangePicker } = DatePicker;

interface ReportFiltersProps {
  filters: ReportFilter[];
  onFilterChange: (values: any) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onFilterChange(values);
  };

  const handleReset = () => {
    form.resetFields();
    onFilterChange({});
  };

  const renderFilter = (filter: ReportFilter) => {
    switch (filter.type) {
      case 'date-range':
        return (
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['Start Date', 'End Date']}
          />
        );
      case 'search':
        return <Input placeholder={`Search by ${filter.label}`} />;
      default:
        return null;
    }
  };

  return (
    <Form form={form} onFinish={handleFinish} layout="vertical">
      <Row gutter={16}>
        {filters.map((filter) => (
          <Col key={filter.key} xs={24} sm={12} md={8} lg={6}>
            <Form.Item name={filter.key} label={filter.label}>
              {renderFilter(filter)}
            </Form.Item>
          </Col>
        ))}
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit">
            Apply Filters
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleReset}>
            Reset
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default ReportFilters;
