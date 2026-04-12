import type { TableProps } from 'antd/es/table';

export type DemoOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export type ProfessionalOrderRow = {
  key: string;
  id: number;
  orderCode: string;
  customerName: string;
  status: DemoOrderStatus;
  amount: number;
  createdAt: string;
  note?: string;
};

export type ProfessionalAntTableProps = Omit<TableProps<ProfessionalOrderRow>, 'columns' | 'dataSource'> & {
  dataSource?: ProfessionalOrderRow[];
  /** Chiều cao vùng body cuộn — tiêu đề bám theo khi cuộn trong khối này */
  scrollY?: number | string;
};
