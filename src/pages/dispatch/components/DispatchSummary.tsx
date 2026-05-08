import { Card, Col, Row, Statistic } from 'antd';
import { CheckCircleOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';

export interface DispatchSummaryProps {
  loading?: boolean;
  newCount: number;
  runningCount: number;
  completedCount: number;
}

export function DispatchSummary({ loading, newCount, runningCount, completedCount }: DispatchSummaryProps) {
  return (
    <Card size="small" className="rounded-2xl border border-slate-200/80 shadow-sm" styles={{ body: { padding: '16px 20px' } }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Chuyến mới"
            value={newCount}
            prefix={<PlusOutlined className="text-blue-500" />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Đang chạy"
            value={runningCount}
            prefix={<PlayCircleOutlined className="text-amber-500" />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Hoàn thành"
            value={completedCount}
            prefix={<CheckCircleOutlined className="text-emerald-500" />}
            loading={loading}
          />
        </Col>
      </Row>
    </Card>
  );
}
