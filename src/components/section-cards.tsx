import type { ReactNode } from "react"
import TrendingUpIcon from "lucide-react/dist/esm/icons/trending-up"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import type { DashboardStats } from "@/types"
import { formatCurrencyVND } from "@/utils/format"

interface SectionCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Doanh thu tháng: ưu tiên stats.revenue từ API, không thì client tính từ chuyến */
  revenue?: {
    total: number | undefined;
    tripCount: number;
    loading: boolean;
    error?: string | null;
    fromApi: boolean;
  };
}

const statValueClassName =
  "pr-[4.5rem] text-3xl font-semibold tabular-nums leading-none tracking-tight " +
  "sm:pr-16 sm:text-4xl xl:pr-[4.25rem] xl:text-3xl 2xl:text-4xl"

function DashboardStatCard({
  loading,
  loadingLabel,
  description,
  value,
  badgeLabel,
  footerTitle,
  footerSubtitle,
  valueClassName,
}: {
  loading: boolean;
  loadingLabel: string;
  description: string;
  value: ReactNode;
  badgeLabel: string;
  footerTitle: string;
  footerSubtitle: string;
  valueClassName?: string;
}) {
  return (
    <Card
      size="default"
      className={cn(
        "@container/card w-full min-w-0 gap-3 shadow-xs",
        "min-h-[9rem] sm:min-h-[9.5rem] xl:min-h-[10rem]",
        "justify-between bg-gradient-to-t from-primary/5 to-card dark:bg-card"
      )}
    >
      <CardHeader className="relative flex-none space-y-2 px-4 pb-0 pt-0">
        <CardDescription className="line-clamp-2 text-sm leading-snug">
          {description}
        </CardDescription>
        <CardTitle className={valueClassName ?? statValueClassName}>
          {loading ? (
            <span className="text-2xl font-medium sm:text-3xl">{loadingLabel}</span>
          ) : (
            value
          )}
        </CardTitle>
        <div className="absolute right-3 top-3 max-w-[min(100%-1rem,11rem)] sm:right-4 sm:top-4">
          <Badge
            variant="outline"
            className="flex min-h-7 max-w-full items-center gap-1 truncate rounded-lg px-2 py-0.5 text-xs"
          >
            <TrendingUpIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{loading ? loadingLabel : badgeLabel}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-1 border-t px-4 py-3.5 text-sm">
        <div className="line-clamp-1 flex items-center gap-2 font-medium leading-tight">
          {footerTitle}
          <TrendingUpIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
        <div className="text-xs leading-snug text-muted-foreground sm:text-sm">{footerSubtitle}</div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards({ stats, loading, error, onRetry, revenue }: SectionCardsProps) {
  const { t } = useTranslation()
  const loadingLabel = t('common.loading')
  const revenueValueClassName = cn(statValueClassName, "text-2xl sm:text-3xl xl:text-2xl 2xl:text-3xl break-words")

  return (
    <div className="space-y-4 px-4 lg:px-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.loadError')}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" className="shrink-0 border-destructive/40" onClick={() => void onRetry()}>
                {t('dashboard.statsRetry')}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          loading={!!loading}
          loadingLabel={loadingLabel}
          description={t('dashboard.cards.totalCompanies')}
          value={stats?.companies?.total ?? 0}
          badgeLabel={`${stats?.companies?.active ?? 0} ${t('common.active')}`}
          footerTitle={t('dashboard.cards.totalCompanies')}
          footerSubtitle={t('dashboard.cards.activeCompanies')}
        />
        <DashboardStatCard
          loading={!!loading}
          loadingLabel={loadingLabel}
          description={t('dashboard.cards.totalEmployees')}
          value={stats?.employees?.total ?? 0}
          badgeLabel={`${stats?.employees?.active ?? 0} ${t('common.active')}`}
          footerTitle={t('dashboard.cards.totalEmployees')}
          footerSubtitle={t('dashboard.cards.activeEmployees')}
        />
        <DashboardStatCard
          loading={!!loading}
          loadingLabel={loadingLabel}
          description={t('dashboard.cards.totalVehicles')}
          value={stats?.vehicles?.total ?? 0}
          badgeLabel={`${stats?.vehicles?.active ?? 0} ${t('common.active')}`}
          footerTitle={t('dashboard.cards.totalVehicles')}
          footerSubtitle={t('dashboard.cards.activeVehicles')}
        />
        <DashboardStatCard
          loading={!!loading}
          loadingLabel={loadingLabel}
          description={t('dashboard.cards.totalTrips')}
          value={stats?.trips?.total ?? 0}
          badgeLabel={`${stats?.trips?.completed ?? 0} ${t('dashboard.cards.completed')}`}
          footerTitle={t('dashboard.cards.totalTrips')}
          footerSubtitle={t('dashboard.cards.completedTrips')}
        />
        {revenue ? (
          <DashboardStatCard
            loading={!!revenue.loading}
            loadingLabel={loadingLabel}
            description={t('dashboard.cards.totalRevenue')}
            value={formatCurrencyVND(revenue.total)}
            badgeLabel={
              revenue.fromApi
                ? `${stats?.trips?.completed ?? 0} ${t('dashboard.cards.completed')}`
                : `${revenue.tripCount} ${t('dashboard.cards.completed')}`
            }
            footerTitle={t('dashboard.cards.totalRevenue')}
            footerSubtitle={
              revenue.error
                ? revenue.error
                : revenue.fromApi
                  ? t('dashboard.cards.revenueFromReport')
                  : t('dashboard.cards.revenueFromTripsHint')
            }
            valueClassName={revenueValueClassName}
          />
        ) : null}
      </div>
    </div>
  )
}
