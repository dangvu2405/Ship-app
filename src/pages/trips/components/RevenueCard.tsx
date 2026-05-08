import { Card, Descriptions, Typography } from 'antd';
import type { Trip } from '@/types';
import { computeTripRevenueR10, sumTripSurchargesAmounts } from '@/pages/trips/trip-revenue';
import { formatMoney } from '@/utils/displayFormat';

export interface RevenueCardProps {
  trip: Pick<Trip, 'base_price' | 'price' | 'total_revenue' | 'surcharge_amount'> & {
    trip_surcharges?: Trip['trip_surcharges'];
  };
}

export function RevenueCard({ trip }: RevenueCardProps) {
  const base = Number(trip.base_price ?? trip.price ?? 0);
  const sumLines = sumTripSurchargesAmounts(trip.trip_surcharges);
  const totalR10 = computeTripRevenueR10(trip);

  return (
    <Card title="Doanh thu (R10)" size="small" className="rounded-xl border shadow-sm">
      <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
        Tổng = cước cơ bản + tổng phụ phí theo dòng <code>trip_surcharges</code>
      </Typography.Paragraph>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="base_price">{formatMoney(base, { withCurrency: true })}</Descriptions.Item>
        <Descriptions.Item label="Σ trip_surcharges.amount">{formatMoney(sumLines, { withCurrency: true })}</Descriptions.Item>
        {trip.surcharge_amount != null ? (
          <Descriptions.Item label="surcharge_amount (legacy)">
            {formatMoney(Number(trip.surcharge_amount), { withCurrency: true })}
          </Descriptions.Item>
        ) : null}
        <Descriptions.Item label="total_revenue (R10)">
          <Typography.Text strong>{formatMoney(totalR10, { withCurrency: true })}</Typography.Text>
        </Descriptions.Item>
        {trip.total_revenue != null ? (
          <Descriptions.Item label="total_revenue (API)">
            {formatMoney(Number(trip.total_revenue), { withCurrency: true })}
          </Descriptions.Item>
        ) : null}
      </Descriptions>
    </Card>
  );
}
