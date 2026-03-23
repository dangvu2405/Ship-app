import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { TableSkeleton } from "@/components/common/TableSkeleton"


export default function Dashboard() {
  const { stats, statsLoading } = useDashboardStats({
    enablePolling: true,
    pollingInterval: 60000, // Poll every minute
  });

  return (
    <>
      <SectionCards stats={stats} loading={statsLoading} />
      <ChartAreaInteractive />
      {statsLoading ? (
        <div className="p-6">
          <TableSkeleton rows={10} columns={6} />
        </div>
      ) : (
        <DataTable data={[]}/>
      )}
    </>
  )
}
