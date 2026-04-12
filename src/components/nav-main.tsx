import { type Icon } from "@tabler/icons-react"
import { Link, useLocation } from 'react-router-dom'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { startNavigationProgress } from '@/lib/navigation-progress'

type NavMainItem = {
  title: string
  url?: string
  icon?: Icon
  onClick?: () => void
}

export function NavMain({
  items,
}: {
  items: NavMainItem[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup className='px-3 py-3'>
      <SidebarGroupLabel className='px-3 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/55 uppercase'>主导航</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className='space-y-1.5'>
          {items.map((item) => {
            const isActive = item.url ? location.pathname === item.url : false

            return (
            <SidebarMenuItem key={item.title}>
              {item.url ? (
                <SidebarMenuButton
                  asChild
                  size='lg'
                  isActive={isActive}
                  tooltip={item.title}
                  className='rounded-2xl border border-transparent px-3.5 text-[15px] font-medium text-sidebar-foreground/78 shadow-none transition-all duration-200 hover:border-sidebar-border/70 hover:bg-white/70 hover:text-sidebar-foreground hover:shadow-sm dark:hover:bg-white/6 data-[active=true]:border-sidebar-border/80 data-[active=true]:bg-white data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.42)] dark:data-[active=true]:bg-white/8 dark:data-[active=true]:shadow-none [&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/70 data-[active=true]:[&>svg]:text-primary'
                >
                  <Link to={item.url} onClick={() => startNavigationProgress()}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  size='lg'
                  onClick={item.onClick}
                  tooltip={item.title}
                  className='rounded-2xl border border-transparent px-3.5 text-[15px] font-medium text-sidebar-foreground/78 shadow-none transition-all duration-200 hover:border-sidebar-border/70 hover:bg-white/70 hover:text-sidebar-foreground hover:shadow-sm dark:hover:bg-white/6 [&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/70'
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
