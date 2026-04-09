import * as React from "react"
import { Link } from "react-router-dom"
import LayoutDashboardIcon from "lucide-react/dist/esm/icons/layout-dashboard"
import SettingsIcon from "lucide-react/dist/esm/icons/settings"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import PercentIcon from "lucide-react/dist/esm/icons/percent"
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import AnchorIcon from "lucide-react/dist/esm/icons/anchor"
import ShieldIcon from "lucide-react/dist/esm/icons/shield"
import LayersIcon from "lucide-react/dist/esm/icons/layers"
import UserRoundCogIcon from "lucide-react/dist/esm/icons/user-round-cog"
import CarFrontIcon from "lucide-react/dist/esm/icons/car-front"
import BellIcon from "lucide-react/dist/esm/icons/bell"
import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/stores/auth.store"
import { useTranslation } from "@/hooks/useTranslation"
import { ROUTES } from "@/routes"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const isAdmin = user?.roles?.some((role) => role.name === 'admin') ?? false

  const adminMenu = [
    {
      title: t('dashboard.title'),
      url: ROUTES.dashboard,
      icon: LayoutDashboardIcon,
    },
    {
      title: t('trips.title'),
      url: ROUTES.admin.trips.list,
      icon: RouteIcon,
    },
    {
      title: t('tripBonusRules.title'),
      url: ROUTES.admin.trip_bonus_rules.list,
      icon: PercentIcon,
      adminOnly: true,
    },
    {
      title: t('payrolls.title'),
      url: ROUTES.admin.payrolls.list,
      icon: DollarSignIcon,
    },
    {
      title: t('reports.title'),
      url: ROUTES.admin.reports.list,
      icon: FileTextIcon,
    },
    {
      title: t('companies.title'),
      icon: LayersIcon,
      items: [
        { title: t('companies.title'), url: ROUTES.admin.companies.list },
        { title: t('offices.title'), url: ROUTES.admin.offices.list },
        { title: t('departments.title'), url: ROUTES.admin.departments.list },
        { title: t('positions.title'), url: ROUTES.admin.positions.list },
      ],
    },
    {
      title: t('employees.title'),
      icon: UserRoundCogIcon,
      items: [
        { title: t('employees.title'), url: ROUTES.admin.employees.list },
        { title: t('attendances.title'), url: ROUTES.admin.attendances.list },
        { title: t('drivers.title'), url: ROUTES.admin.drivers.list },
        { title: t('customers.title'), url: ROUTES.admin.customers.list },
        { title: t('allowances.title'), url: ROUTES.admin.allowances.list },
        { title: t('deductions.title'), url: ROUTES.admin.deductions.list },
      ],
    },
    {
      title: t('vehicles.title'),
      icon: CarFrontIcon,
      items: [
        { title: t('vehicles.title'), url: ROUTES.admin.vehicles.list },
        { title: t('invoices.title'), url: ROUTES.admin.invoices.list },
        { title: t('vehicleAssignments.title'), url: ROUTES.admin.vehicle_assignments.list },
        { title: t('vehicleExpenses.title'), url: ROUTES.admin.vehicle_expenses.list },
      ],
    },
    {
      title: t('users.title'),
      icon: ShieldIcon,
      adminOnly: true,
      items: [
        { title: t('users.title'), url: ROUTES.admin.users.list },
        { title: t('roles.title'), url: ROUTES.admin.roles.list },
      ],
    },
  ]

  const operatorMenu = [
    {
      title: t('dashboard.title'),
      url: ROUTES.dashboard,
      icon: LayoutDashboardIcon,
    },
    {
      title: t('trips.title'),
      url: ROUTES.admin.trips.list,
      icon: RouteIcon,
    },
    {
      title: t('payrolls.title'),
      url: ROUTES.admin.payrolls.list,
      icon: DollarSignIcon,
    },
    {
      title: t('employees.title'),
      icon: UserRoundCogIcon,
      items: [
        { title: t('employees.title'), url: ROUTES.admin.employees.list },
        { title: t('attendances.title'), url: ROUTES.admin.attendances.list },
      ],
    },
    {
      title: t('vehicles.title'),
      icon: CarFrontIcon,
      items: [
        { title: t('vehicles.title'), url: ROUTES.admin.vehicles.list },
        { title: t('invoices.title'), url: ROUTES.admin.invoices.list },
      ],
    },
  ]

  const filteredNavMain = (isAdmin ? adminMenu : operatorMenu).filter((item) => {
    if (!('adminOnly' in item) || !item.adminOnly) {
      return true
    }
    return isAdmin
  })

  const navSecondary = [
    {
      title: t('header.notifications'),
      url: ROUTES.admin.notifications,
      icon: BellIcon,
    },
    {
      title: t('header.profile'),
      url: ROUTES.admin.profile,
      icon: CircleUserIcon,
    },
    {
      title: t('header.settings'),
      url: ROUTES.admin.settings,
      icon: SettingsIcon,
    },
  ]

  const userData = {
    name: user?.username || "User",
    email: user?.email || "user@example.com",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to={ROUTES.dashboard}>
                <AnchorIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Ship ERP</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
