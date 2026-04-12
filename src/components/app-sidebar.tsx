import * as React from "react"
import { Link, useNavigate } from 'react-router-dom'
import {
  IconBook,
  IconBrandTelegram,
  IconCreditCard,
  IconDashboard,
  IconInnerShadowTop,
  IconLifebuoy,
  IconLink,
  IconPercentage,
  IconReceipt,
  IconRoute,
  IconShieldLock,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from '@/features/auth/auth-context'
import { appConfig } from '@/lib/config'
import { startNavigationProgress } from '@/lib/navigation-progress'


function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()

  const handleTicketRedirect = () => {
    onOpenChange(false)
    startNavigationProgress()
    navigate('/tickets')
  }

  const handleKnowledgeRedirect = () => {
    onOpenChange(false)
    startNavigationProgress()
    navigate('/knowledge')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>获取支持</DialogTitle>
            <DialogDescription>
              你可以通过 Telegram 联系客服或加入官方群组，也可以直接提交工单，我们会尽快处理。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 pt-2 md:grid-cols-3 md:items-stretch">
            <div className="rounded-2xl border border-border bg-muted/30 p-4 md:h-full">
              <div className="mb-3 flex items-center justify-center gap-2 text-center text-sm font-medium">
                <IconBrandTelegram className="size-4 text-primary" />
                联系我们
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-1 text-foreground">客服 Telegram</div>
                  <a
                    href={appConfig.support.telegramContactUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {appConfig.support.telegramContactLabel}
                  </a>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-1 text-foreground">Telegram 群组</div>
                  <a
                    href={appConfig.support.telegramGroupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {appConfig.support.telegramGroupLabel}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 md:flex md:h-full md:flex-col">
              <div className="mb-3 flex items-center justify-center gap-2 text-center text-sm font-medium">
                <IconUsers className="size-4 text-primary" />
                提交工单
              </div>
              <div className="space-y-3 text-sm text-muted-foreground md:flex md:flex-1 md:flex-col md:justify-between md:space-y-4">
                <p>
                  如需处理订单、订阅、节点或账号问题，可直接提交工单。
                </p>
                <Button className="w-full" onClick={handleTicketRedirect}>
                  前往工单页面
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 md:flex md:h-full md:flex-col">
              <div className="mb-3 flex items-center justify-center gap-2 text-center text-sm font-medium">
                <IconBook className="size-4 text-primary" />
                帮助文档
              </div>
              <div className="space-y-3 text-sm text-muted-foreground md:flex md:flex-1 md:flex-col md:justify-between md:space-y-4">
                <p>
                  可先查看使用文档与常见问题，再决定是否提交工单。
                </p>
                <Button className="w-full" variant="outline" onClick={handleKnowledgeRedirect}>
                  前往帮助文档
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout, user } = useAuth()
  const [supportOpen, setSupportOpen] = React.useState(false)

  const sidebarUser = {
    name: appConfig.appName,
    email: user?.email ?? 'demo@dk-theme.local',
    avatar: user?.avatar_url ?? '/avatars/shadcn.jpg',
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard" onClick={() => startNavigationProgress()}>
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">{appConfig.appName} 控制台</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            { title: "用户中心", url: "/dashboard", icon: IconDashboard },
            { title: "订阅中心", url: "/clients", icon: IconLink },
            { title: "订购套餐", url: "/plans", icon: IconCreditCard },
            { title: "节点状态", url: "/node-status", icon: IconRoute },
            { title: "订单中心", url: "/orders", icon: IconReceipt },
            { title: "邀请返利", url: "/invite", icon: IconPercentage },
            { title: "工单支持", url: "/tickets", icon: IconTicket },
            { title: "安全中心", url: "/settings", icon: IconShieldLock },
            { title: "帮助文档", url: "/knowledge", icon: IconBook },
            { title: "获取支持", icon: IconLifebuoy, onClick: () => setSupportOpen(true) },
          ]}
        />
        <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
