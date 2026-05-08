import type { Trip, TripSurcharge } from '@/types';

export function sumTripSurchargesAmounts(surcharges: TripSurcharge[] | undefined): number {
  return (surcharges ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);
}

/** R10: total_revenue = base_price + SUM(trip_surcharges.amount) */
export function computeTripRevenueR10(
  trip: Pick<Trip, 'base_price' | 'price'> & { trip_surcharges?: TripSurcharge[] },
): number {
  const base = Number(trip.base_price ?? trip.price ?? 0);
  return base + sumTripSurchargesAmounts(trip.trip_surcharges);
}
