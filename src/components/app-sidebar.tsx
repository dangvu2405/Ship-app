import * as React from "react"
import { Link } from "react-router-dom"
import LayoutDashboardIcon from "lucide-react/dist/esm/icons/layout-dashboard"
import UsersIcon from "lucide-react/dist/esm/icons/users"
import SettingsIcon from "lucide-react/dist/esm/icons/settings"
import BuildingIcon from "lucide-react/dist/esm/icons/building"
import UserIcon from "lucide-react/dist/esm/icons/user"
import TruckIcon from "lucide-react/dist/esm/icons/truck"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import AnchorIcon from "lucide-react/dist/esm/icons/anchor"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import BriefcaseIcon from "lucide-react/dist/esm/icons/briefcase"
import NetworkIcon from "lucide-react/dist/esm/icons/network"
import ContactIcon from "lucide-react/dist/esm/icons/contact"
import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"
import ScrollTextIcon from "lucide-react/dist/esm/icons/scroll-text"
import Link2Icon from "lucide-react/dist/esm/icons/link-2"
import WalletCardsIcon from "lucide-react/dist/esm/icons/wallet-cards"
import GiftIcon from "lucide-react/dist/esm/icons/gift"
import CircleMinusIcon from "lucide-react/dist/esm/icons/circle-minus"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import ShieldIcon from "lucide-react/dist/esm/icons/shield"

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

  const navMain = [
    {
      title: t('dashboard.title'),
      url: ROUTES.dashboard,
      icon: LayoutDashboardIcon,
    },
    {
      title: t('companies.title'),
      url: ROUTES.admin.companies.list,
      icon: BuildingIcon,
    },
    {
      title: t('offices.title'),
      url: ROUTES.admin.offices.list,
      icon: MapPinIcon,
    },
    {
      title: t('departments.title'),
      url: ROUTES.admin.departments.list,
      icon: NetworkIcon,
    },
    {
      title: t('positions.title'),
      url: ROUTES.admin.positions.list,
      icon: BriefcaseIcon,
    },
    {
      title: t('employees.title'),
      url: ROUTES.admin.employees.list,
      icon: UserIcon,
    },
    {
      title: t('vehicles.title'),
      url: ROUTES.admin.vehicles.list,
      icon: TruckIcon,
    },
    {
      title: t('trips.title'),
      url: ROUTES.admin.trips.list,
      icon: RouteIcon,
    },
    {
      title: t('customers.title'),
      url: ROUTES.admin.customers.list,
      icon: ContactIcon,
    },
    {
      title: t('drivers.title'),
      url: ROUTES.admin.drivers.list,
      icon: CircleUserIcon,
    },
    {
      title: t('invoices.title'),
      url: ROUTES.admin.invoices.list,
      icon: ScrollTextIcon,
    },
    {
      title: t('vehicleAssignments.title'),
      url: ROUTES.admin.vehicle_assignments.list,
      icon: Link2Icon,
    },
    {
      title: t('vehicleExpenses.title'),
      url: ROUTES.admin.vehicle_expenses.list,
      icon: WalletCardsIcon,
    },
    {
      title: t('allowances.title'),
      url: ROUTES.admin.allowances.list,
      icon: GiftIcon,
    },
    {
      title: t('deductions.title'),
      url: ROUTES.admin.deductions.list,
      icon: CircleMinusIcon,
    },
    {
      title: t('attendances.title'),
      url: ROUTES.admin.attendances.list,
      icon: CalendarDaysIcon,
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
      title: t('users.title'),
      url: ROUTES.admin.users.list,
      icon: UsersIcon,
      adminOnly: true,
    },
    {
      title: t('roles.title'),
      url: ROUTES.admin.roles.list,
      icon: ShieldIcon,
      adminOnly: true,
    },
  ]

  const filteredNavMain = navMain.filter((item) => {
    if (!('adminOnly' in item) || !item.adminOnly) {
      return true
    }
    return isAdmin
  })

  const navSecondary = [
    {
      title: t('header.settings'),
      url: ROUTES.admin.settings,
      icon: SettingsIcon,
    },
    {
      title: 'Get Help',
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: t('common.search'),
      url: "#",
      icon: SearchIcon,
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
