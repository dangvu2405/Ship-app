import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { DashboardRecentTrips } from "@/components/dashboard/DashboardRecentTrips"


export default function Dashboard() {
  const { stats, statsLoading } = useDashboardStats({
    enablePolling: true,
    pollingInterval: 60000, // Poll every minute
  });

  return (
    <>
      <SectionCards stats={stats} loading={statsLoading} />
      <ChartAreaInteractive />
      <DashboardRecentTrips />
    </>
  )
}
