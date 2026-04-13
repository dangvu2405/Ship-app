import { Suspense, useMemo, useState } from "react"
import { useList } from "@refinedev/core"
import { SectionCards } from "@/components/section-cards"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useDashboardTripRevenue } from "@/hooks/useDashboardTripRevenue"
import { DashboardRevenueByCompany } from "@/components/dashboard/DashboardRevenueByCompany"
import { DashboardChartSkeleton } from "@/components/dashboard/DashboardChartSkeleton"
import { lazyWithMinDelay } from "@/utils/lazyWithMinDelay"
import type { Company, Office } from "@/types"

const ChartAreaInteractive = lazyWithMinDelay(() =>
  import("@/components/chart-area-interactive").then((m) => ({ default: m.ChartAreaInteractive })),
)

export default function Dashboard() {
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const period = useMemo(() => {
    const d = new Date()
    return { month: d.getMonth() + 1, year: d.getFullYear() }
  }, [])

  const { data: companiesData } = useList<Company>({
    resource: "companies",
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: "status", operator: "eq", value: "active" }],
    sorters: [{ field: "name", order: "asc" }],
  })
  const companies = useMemo(() => companiesData?.data ?? [], [companiesData])

  const { data: officesData } = useList<Office>({
    resource: "offices",
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: "name", order: "asc" }],
  })
  const offices = officesData?.data ?? []

  const { stats, statsLoading, statsError, refetchStats } = useDashboardStats({
    enablePolling: true,
    pollingInterval: 60000,
    companyId,
  })

  const {
    total: clientRevenueTotal,
    tripCount: clientTripCount,
    loading: revenueLoading,
    error: revenueError,
  } = useDashboardTripRevenue({
    companyId,
    month: period.month,
    year: period.year,
  })

  const fromApi = stats?.revenue != null
  const revenueTotal = fromApi ? (stats?.revenue?.total ?? 0) : clientRevenueTotal
  const revenueTripCount = fromApi ? (stats?.trips?.completed ?? 0) : clientTripCount
  const revenueCardLoading = statsLoading || (!fromApi && revenueLoading)

  return (
    <>
      <SectionCards
        stats={stats}
        loading={statsLoading}
        error={statsError}
        onRetry={refetchStats}
        revenue={{
          total: revenueTotal,
          tripCount: revenueTripCount,
          loading: revenueCardLoading,
          error: fromApi ? undefined : revenueError ?? undefined,
          fromApi,
        }}
      />
      <div className="space-y-4 px-4 pb-6 lg:px-6">
        <Suspense fallback={<DashboardChartSkeleton />}>
          <ChartAreaInteractive
            companyId={companyId}
            onCompanyIdChange={setCompanyId}
            companies={companies}
            offices={offices}
          />
        </Suspense>
        <DashboardRevenueByCompany
          companies={companies}
          companyId={companyId}
          month={period.month}
          year={period.year}
        />
      </div>
    </>
  )
}
