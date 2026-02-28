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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const navMain = [
    {
      title: t('dashboard.title'),
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: t('companies.title'),
      url: "/admin/companies",
      icon: BuildingIcon,
    },
    {
      title: t('employees.title'),
      url: "/admin/employees",
      icon: UserIcon,
    },
    {
      title: t('vehicles.title'),
      url: "/admin/vehicles",
      icon: TruckIcon,
    },
    {
      title: t('trips.title'),
      url: "/admin/trips",
      icon: RouteIcon,
    },
    {
      title: t('payrolls.title'),
      url: "/admin/payrolls",
      icon: DollarSignIcon,
    },
    {
      title: t('reports.title'),
      url: "/admin/reports",
      icon: FileTextIcon,
    },
    {
      title: t('users.title'),
      url: "/admin/users",
      icon: UsersIcon,
    },
  ]

  const navSecondary = [
    {
      title: t('header.settings'),
      url: "/admin/settings",
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
              <Link to="/dashboard">
                <AnchorIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Ship ERP</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
