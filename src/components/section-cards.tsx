import TrendingUpIcon from "lucide-react/dist/esm/icons/trending-up"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import type { DashboardStats } from "@/types"

interface SectionCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export function SectionCards({ stats, loading }: SectionCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{t('dashboard.cards.totalCompanies')}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? '...' : stats?.companies?.total || 0}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {loading ? '...' : `${stats?.companies?.active || 0} ${t('common.active')}`}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('dashboard.cards.totalCompanies')} <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {t('dashboard.cards.activeCompanies')}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{t('dashboard.cards.totalEmployees')}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? '...' : stats?.employees?.total || 0}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {loading ? '...' : `${stats?.employees?.active || 0} ${t('common.active')}`}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('dashboard.cards.totalEmployees')} <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {t('dashboard.cards.activeEmployees')}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{t('dashboard.cards.totalVehicles')}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? '...' : stats?.vehicles?.total || 0}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {loading ? '...' : `${stats?.vehicles?.active || 0} ${t('common.active')}`}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('dashboard.cards.totalVehicles')} <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('dashboard.cards.activeVehicles')}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>{t('dashboard.cards.totalTrips')}</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? '...' : stats?.trips?.total || 0}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {loading ? '...' : `${stats?.trips?.completed || 0} ${t('dashboard.cards.completed')}`}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('dashboard.cards.totalTrips')} <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('dashboard.cards.completedTrips')}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
