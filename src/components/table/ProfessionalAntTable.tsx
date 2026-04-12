import { useCallback, useMemo, useState, type Key } from 'react';
import { Button, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

import { formatCurrencyVND } from '@/utils/format';

import { matchesTextFilter, PROFESSIONAL_TABLE_SAMPLE_DATA, STATUS_META } from './professionalAntTableData';
import type { DemoOrderStatus, ProfessionalAntTableProps, ProfessionalOrderRow } from './professionalAntTableTypes';

import './professional-ant-table.scss';

function TextFilterDropdown({ placeholder }: { placeholder: string }) {
  return function TextFilter({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) {
    return (
      <div className="flex flex-col gap-2 p-2" onKeyDown={(e) => e.stopPropagation()}>
        <Input
          allowClear
          size="small"
          placeholder={placeholder}
          value={(selectedKeys[0] as string) ?? ''}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
        />
        <Space size="small" className="justify-end">
          <Button size="small" type="link" onClick={() => clearFilters?.()}>
            Xóa
          </Button>
          <Button size="small" type="primary" onClick={() => confirm()}>
            Lọc
          </Button>
        </Space>
      </div>
    );
  };
}

/**
 * Bảng Ant Design mẫu: căn phải số, Tag trạng thái, cột cố định trái, lọc theo cột,
 * format ngày (dayjs) + tiền VND, hover hàng, size middle.
 */
export function ProfessionalAntTable({ dataSource = PROFESSIONAL_TABLE_SAMPLE_DATA, scrollY = 420, ...tableProps }: ProfessionalAntTableProps) {
  const [filteredInfo, setFilteredInfo] = useState<Record<string, Key[] | null | undefined>>({});

  const handleChange: NonNullable<TableProps<ProfessionalOrderRow>['onChange']> = useCallback((_pagination, filters) => {
    setFilteredInfo((filters ?? {}) as Record<string, Key[] | null | undefined>);
  }, []);

  const columns: ColumnsType<ProfessionalOrderRow> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 88,
        align: 'right',
        sorter: (a, b) => a.id - b.id,
        render: (id: number) => <Typography.Text type="secondary">{id}</Typography.Text>,
      },
      {
        title: 'Mã đơn hàng',
        dataIndex: 'orderCode',
        key: 'orderCode',
        width: 150,
        fixed: 'left',
        filterDropdown: TextFilterDropdown({ placeholder: 'Tìm mã…' }),
        filterIcon: <SearchOutlined className={filteredInfo.orderCode?.length ? 'text-primary' : ''} />,
        onFilter: (value, record) => matchesTextFilter(value, record, 'orderCode'),
        filteredValue: filteredInfo.orderCode ?? null,
        render: (code: string) => <Typography.Text strong>{code}</Typography.Text>,
      },
      {
        title: 'Tên khách hàng',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 220,
        fixed: 'left',
        ellipsis: true,
        filterDropdown: TextFilterDropdown({ placeholder: 'Tìm tên…' }),
        filterIcon: <SearchOutlined className={filteredInfo.customerName?.length ? 'text-primary' : ''} />,
        onFilter: (value, record) => matchesTextFilter(value, record, 'customerName'),
        filteredValue: filteredInfo.customerName ?? null,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        align: 'center',
        filters: (Object.keys(STATUS_META) as DemoOrderStatus[]).map((s) => ({
          text: STATUS_META[s].label,
          value: s,
        })),
        filteredValue: filteredInfo.status ?? null,
        onFilter: (value, record) => record.status === value,
        render: (status: DemoOrderStatus) => {
          const meta = STATUS_META[status];
          return (
            <Tag color={meta.color} className="m-0">
              {meta.label}
            </Tag>
          );
        },
      },
      {
        title: 'Số tiền (VND)',
        dataIndex: 'amount',
        key: 'amount',
        width: 150,
        align: 'right',
        sorter: (a, b) => a.amount - b.amount,
        render: (amount: number) => (
          <Typography.Text className="tabular-nums">{formatCurrencyVND(amount)}</Typography.Text>
        ),
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 168,
        sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
        render: (iso: string) => (
          <Typography.Text type="secondary" className="tabular-nums">
            {dayjs(iso).isValid() ? dayjs(iso).format('DD/MM/YYYY HH:mm') : '—'}
          </Typography.Text>
        ),
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        key: 'note',
        ellipsis: true,
        responsive: ['md'],
        render: (note: string | undefined) => note || <Typography.Text type="secondary">—</Typography.Text>,
      },
    ],
    [filteredInfo],
  );

  return (
    <div className="professional-ant-table">
      <Table<ProfessionalOrderRow>
        bordered
        size="middle"
        rowKey="key"
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `${total} đơn` }}
        onChange={handleChange}
        scroll={{ x: 'max-content', y: scrollY }}
        {...tableProps}
      />
    </div>
  );
}
