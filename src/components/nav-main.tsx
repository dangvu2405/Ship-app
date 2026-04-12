import type { LucideIcon } from 'lucide-react';
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: ({
    title: string
    url: string
    icon?: LucideIcon
  } | {
    title: string
    icon?: LucideIcon
    items: {
      title: string
      url: string
    }[]
  })[]
}) {
  const location = useLocation()
  const pathname = location.pathname

  const isRouteActive = (url: string) => pathname === url || pathname.startsWith(url + '/')
  const defaultOpenGroup = useMemo(() => {
    for (const item of items) {
      if (
        'items' in item &&
        item.items.some((child) => pathname === child.url || pathname.startsWith(child.url + '/'))
      ) {
        return item.title
      }
    }
    return null
  }, [items, pathname])
  const [openGroupTitle, setOpenGroupTitle] = useState<string | null>(defaultOpenGroup)

  useEffect(() => {
    if (defaultOpenGroup) {
      setOpenGroupTitle(defaultOpenGroup)
    }
  }, [defaultOpenGroup])

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if ('url' in item) {
              const isActive = isRouteActive(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            const hasActiveChild = item.items.some((child) => isRouteActive(child.url))
            return (
              <SidebarMenuItem key={item.title}>
                <Collapsible
                  open={openGroupTitle === item.title}
                  onOpenChange={(open) => setOpenGroupTitle(open ? item.title : null)}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={hasActiveChild}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto shrink-0 transition-transform duration-300 ease-out group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-300">
                    <SidebarMenuSub>
                      {item.items.map((child) => {
                        const isChildActive = isRouteActive(child.url)
                        return (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton asChild isActive={isChildActive}>
                              <Link to={child.url}>
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
