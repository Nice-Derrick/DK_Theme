import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BellRing, CalendarClock, Gift, Layers3, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/features/auth/auth-context"
import { formatBytes, formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { updateReminderSettings } from "@/lib/api/services/settings"
import type { UserInfo } from "@/lib/api/types"

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = 'response' in error ? (error as { response?: { data?: { message?: unknown } } }).response : undefined
    const responseMessage = maybeResponse?.data?.message
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage

    const directMessage = 'message' in error ? (error as { message?: unknown }).message : undefined
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
  }

  return fallback
}

function getDaysUntilNextMonthReset() {
  const now = new Date()
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const ms = nextReset.getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

type CompactMetricCardProps = {
  title: string
  value: string
  hint: string
  badge: string
  icon: React.ReactNode
}

function CompactMetricCard({ title, value, hint, badge, icon }: CompactMetricCardProps) {
  return (
    <Card className="@container/card flex h-full flex-col">
      <CardHeader className="gap-1.5 pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
            {icon}
            {badge}
          </Badge>
        </div>
        <CardTitle className="text-[28px] font-semibold leading-none tabular-nums @[250px]/card:text-[30px]">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  )
}

export function SectionCards() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const used = user?.d ?? 0
  const total = user?.transfer_enable ?? 0
  const usageRate = total ? Math.round((used / total) * 100) : 0
  const [remindExpire, setRemindExpire] = useState(user?.remind_expire !== 0)
  const [remindTraffic, setRemindTraffic] = useState(user?.remind_traffic !== 0)

  const resetCountdown = useMemo(() => getDaysUntilNextMonthReset(), [])
  const alertState = remindExpire && remindTraffic
    ? '到期与流量提醒已开启'
    : remindExpire
      ? '到期提醒已开启'
      : remindTraffic
        ? '流量提醒已开启'
        : '提醒未开启'

  const reminderMutation = useMutation({
    mutationFn: updateReminderSettings,
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<UserInfo | undefined>(['settings-user'], (current) =>
        current
          ? {
              ...current,
              remind_expire: variables.remind_expire,
              remind_traffic: variables.remind_traffic,
            }
          : current,
      )
      toast.success('通知设置已更新')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '通知设置更新失败，请稍后重试'))
      const current = queryClient.getQueryData<UserInfo>(['settings-user'])
      setRemindExpire(current?.remind_expire !== 0)
      setRemindTraffic(current?.remind_traffic !== 0)
    },
  })

  function handleToggleReminder(type: 'expire' | 'traffic') {
    const nextExpire = type === 'expire' ? !remindExpire : remindExpire
    const nextTraffic = type === 'traffic' ? !remindTraffic : remindTraffic

    setRemindExpire(nextExpire)
    setRemindTraffic(nextTraffic)
    reminderMutation.mutate({
      remind_expire: nextExpire ? 1 : 0,
      remind_traffic: nextTraffic ? 1 : 0,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <CompactMetricCard
        title="邀请返利"
        value={formatCurrency(user?.commission_balance ?? 0)}
        hint="来自邀请用户的返佣金额，可继续累积。"
        badge="返利"
        icon={<Gift className="size-3.5" />}
      />

      <CompactMetricCard
        title="总流量配额"
        value={formatBytes(total)}
        hint="当前套餐周期内可使用的总流量额度。"
        badge="周期"
        icon={<Layers3 className="size-3.5" />}
      />

      <CompactMetricCard
        title="流量重置倒计时"
        value={`${resetCountdown} 天`}
        hint={`当前使用率 ${usageRate}% · 已用 ${formatBytes(used)}`}
        badge="每月重置"
        icon={<CalendarClock className="size-3.5" />}
      />

      <Card className="@container/card flex h-full flex-col">
        <CardHeader className="gap-2 pb-3">
          <CardDescription>通知提醒</CardDescription>
          <CardTitle className="text-xl font-semibold leading-8 @[250px]/card:text-2xl">
            {alertState}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {reminderMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <BellRing className="size-4" />}
              {remindExpire || remindTraffic ? '已开启' : '可配置'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2.5 dark:border-border/70 dark:bg-background/35">
            <div>
              <div className="text-sm font-medium">到期提醒</div>
              <div className="mt-0.5 text-xs text-muted-foreground">套餐到期前邮件通知</div>
            </div>
            <Button
              size="sm"
              variant={remindExpire ? 'default' : 'outline'}
              className="rounded-full"
              disabled={reminderMutation.isPending}
              onClick={() => handleToggleReminder('expire')}
            >
              {remindExpire ? '已开启' : '已关闭'}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2.5 dark:border-border/70 dark:bg-background/35">
            <div>
              <div className="text-sm font-medium">流量提醒</div>
              <div className="mt-0.5 text-xs text-muted-foreground">流量接近阈值时邮件通知</div>
            </div>
            <Button
              size="sm"
              variant={remindTraffic ? 'default' : 'outline'}
              className="rounded-full"
              disabled={reminderMutation.isPending}
              onClick={() => handleToggleReminder('traffic')}
            >
              {remindTraffic ? '已开启' : '已关闭'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
