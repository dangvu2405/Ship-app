import React from 'react';
import { Card, Typography } from 'antd';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AnalyticsDataPoint } from '../types';

const { Title } = Typography;

interface RevenueChartProps {
  data?: AnalyticsDataPoint[];
  loading?: boolean;
}

const chartConfig = {
  revenue: {
    label: 'Doanh thu',
    color: 'hsl(var(--primary))',
  },
  cost: {
    label: 'Chi phí',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = [], loading }) => {

  return (
    <Card
      loading={loading}
      variant="borderless"
      title={<Title level={5}>Phân tích Tài chính</Title>}
      style={{ height: '100%' }}
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart
          data={data}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 0,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Area
            dataKey="revenue"
            type="monotone"
            fill="var(--color-revenue)"
            fillOpacity={0.1}
            stroke="var(--color-revenue)"
            strokeWidth={2}
            stackId="a"
          />
          <Area
            dataKey="cost"
            type="monotone"
            fill="var(--color-cost)"
            fillOpacity={0.1}
            stroke="var(--color-cost)"
            strokeWidth={2}
            stackId="b"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};
