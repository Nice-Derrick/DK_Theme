import { Suspense, lazy } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { getTrafficLogs } from '@/lib/api/services/traffic'
import { formatBytes, formatCurrency, formatDateTime } from '@/lib/format'
import { Activity, CalendarClock, CreditCard, Gauge, Layers3, Sparkles, TrendingUp, Zap } from 'lucide-react'

const SectionCards = lazy(() => import('@/components/section-cards').then((module) => ({ default: module.SectionCards })))
const ChartAreaInteractive = lazy(() => import('@/components/chart-area-interactive').then((module) => ({ default: module.ChartAreaInteractive })))
const TrafficWeeklySummary = lazy(() => import('@/components/traffic-weekly-summary').then((module) => ({ default: module.TrafficWeeklySummary })))

function DashboardMetricSectionSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className='h-full border-slate-200/80 bg-white/70 shadow-xs dark:border-border/70 dark:bg-background/35'>
          <CardContent className='space-y-3 p-5'>
            <div className='h-3 w-20 rounded-full bg-slate-200/80 dark:bg-white/10' />
            <div className='h-8 w-28 rounded-full bg-slate-200/80 dark:bg-white/10' />
            <div className='h-3 w-32 rounded-full bg-slate-200/70 dark:bg-white/8' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DashboardChartsSkeleton() {
  return (
    <div className='grid min-w-0 gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
      <Card className='min-w-0 overflow-hidden border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.92))] shadow-sm dark:border-border/70 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.92))]'>
        <CardContent className='space-y-4 p-6'>
          <div className='h-6 w-36 rounded-full bg-slate-200/80 dark:bg-white/10' />
          <div className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className='h-28 rounded-2xl border border-slate-200/80 bg-white/70 dark:border-border/70 dark:bg-background/35' />
            ))}
          </div>
          <div className='h-[320px] rounded-3xl border border-slate-200/70 bg-white/70 dark:border-border/60 dark:bg-background/25' />
        </CardContent>
      </Card>

      <Card className='min-w-0 overflow-hidden'>
        <CardContent className='space-y-4 p-6'>
          <div className='h-6 w-32 rounded-full bg-slate-200/80 dark:bg-white/10' />
          <div className='h-[240px] rounded-2xl border border-slate-200/70 bg-white/70 dark:border-border/60 dark:bg-background/25' />
          <div className='h-4 w-40 rounded-full bg-slate-200/70 dark:bg-white/8' />
        </CardContent>
      </Card>
    </div>
  )
}

function formatDashboardUpdatedAt(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function DashboardPage() {
  const { user, subscribe } = useAuth()
  const trafficLogsQuery = useQuery({ queryKey: ['traffic-logs'], queryFn: getTrafficLogs })
  const trafficLogs = trafficLogsQuery.data ?? []

  const planName = subscribe?.plan ?? user?.plan ?? '--'
  const expiredAt = subscribe?.expired_at ?? user?.expired_at
  const totalTraffic = subscribe?.transfer_enable ?? user?.transfer_enable ?? 0
  const usedTraffic = subscribe?.d ?? user?.d ?? 0
  const remainingTraffic = Math.max(totalTraffic - usedTraffic, 0)
  const usageRate = totalTraffic > 0 ? Math.min(100, Math.round((usedTraffic / totalTraffic) * 100)) : 0
  const balance = user?.balance ?? 0
  const commissionBalance = user?.commission_balance ?? 0
  const usageTone = usageRate >= 85 ? '需关注' : usageRate >= 60 ? '持续使用中' : '状态健康'
  const dashboardUpdatedAtLabel = formatDashboardUpdatedAt(new Date())
  const remainingRate = totalTraffic > 0 ? Math.max(0, 100 - usageRate) : 0
  const usageDelta = usageRate >= 85 ? '接近上限' : usageRate >= 60 ? '建议留意使用增速' : '当前余量充足'

  return (
    <>
      <div className='px-4 lg:px-6'>
        <Card className='overflow-hidden border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,252,0.92))] shadow-sm dark:border-border/70 dark:bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(15,23,42,0.92))]'>
          <CardContent className='grid gap-6 p-5 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch lg:p-6'>
            <div className='flex h-full flex-col space-y-5'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='rounded-full border-primary/15 bg-primary/8 px-2.5 py-1 text-primary'>
                  <Sparkles className='size-3.5' />
                  用户中心
                </Badge>
                <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs'>
                  {usageTone}
                </Badge>
              </div>

              <div className='space-y-2'>
                <CardTitle className='text-[30px] font-semibold tracking-tight text-slate-900 dark:text-foreground'>
                  欢迎回来，{user?.email ?? '用户'}
                </CardTitle>
                <CardDescription className='max-w-xl text-sm leading-6 text-slate-500 dark:text-muted-foreground'>
                  当前套餐、到期时间、余额与流量进度都已整理在这里，方便你快速查看续费与使用状态。
                </CardDescription>
              </div>

              <div className='grid flex-1 content-end gap-2.5 sm:grid-cols-2 xl:grid-cols-3'>
                <div className='rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-4 shadow-sm dark:border-border/70 dark:bg-background/35'>
                  <div className='flex min-h-[92px] flex-col'>
                    <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
                      <Layers3 className='size-3.5' /> 当前套餐
                    </div>
                    <div className='mt-2.5 text-base font-semibold text-slate-900 dark:text-foreground'>{planName}</div>
                    <div className='mt-auto pt-2 text-xs text-slate-500 dark:text-muted-foreground'>当前订阅周期</div>
                  </div>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-4 shadow-sm dark:border-border/70 dark:bg-background/35'>
                  <div className='flex min-h-[92px] flex-col'>
                    <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
                      <CalendarClock className='size-3.5' /> 到期时间
                    </div>
                    <div className='mt-2.5 text-base font-semibold text-slate-900 dark:text-foreground'>{formatDateTime(expiredAt)}</div>
                    <div className='mt-auto pt-2 text-xs text-slate-500 dark:text-muted-foreground'>建议提前处理续费</div>
                  </div>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-4 shadow-sm dark:border-border/70 dark:bg-background/35'>
                  <div className='flex min-h-[92px] flex-col'>
                    <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
                      <CreditCard className='size-3.5' /> 账户余额
                    </div>
                    <div className='mt-2.5 text-base font-semibold text-slate-900 dark:text-foreground'>{formatCurrency(balance)}</div>
                    <div className='mt-auto pt-2 text-xs text-slate-500 dark:text-muted-foreground'>返利 {formatCurrency(commissionBalance)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex h-full flex-col rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))] p-4 shadow-sm dark:border-border/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.62),rgba(15,23,42,0.42))] lg:p-5'>
              <div className='flex flex-col items-start gap-3 sm:flex-row sm:justify-between'>
                <div>
                  <div className='flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-foreground'>
                    <Activity className='size-4 text-primary' />
                    本周期流量进度
                  </div>
                  <div className='mt-1 text-xs text-slate-500 dark:text-muted-foreground'>用量概览、剩余额度与当前状态</div>
                </div>
                <Badge
                  variant='outline'
                  className={`rounded-full px-2.5 py-1 text-xs ${usageRate >= 85 ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300' : usageRate >= 60 ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'}`}
                >
                  {usageTone}
                </Badge>
              </div>

              <div className='mt-4 rounded-[28px] border border-slate-200/80 bg-white/80 p-4 dark:border-border/70 dark:bg-background/40'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
                      <Gauge className='size-3.5 text-primary' /> 使用率
                    </div>
                    <div className='mt-2 flex items-end gap-2'>
                      <div className='text-[38px] font-semibold tracking-tight text-slate-900 dark:text-foreground'>{usageRate}%</div>
                      <div className='pb-1 text-xs text-slate-500 dark:text-muted-foreground'>已用配额</div>
                    </div>
                  </div>

                  <div className='rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-right dark:border-border/70 dark:bg-background/40'>
                    <div className='text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>剩余比例</div>
                    <div className='mt-1 text-lg font-semibold text-slate-900 dark:text-foreground'>{remainingRate}%</div>
                  </div>
                </div>

                <div className='mt-4 h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                  <div
                    className={`h-full rounded-full transition-all ${usageRate >= 85 ? 'bg-rose-500' : usageRate >= 60 ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.max(usageRate, totalTraffic > 0 ? 6 : 0)}%` }}
                  />
                </div>

                <div className='mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground'>
                  <span>已用 {formatBytes(usedTraffic)}</span>
                  <span>总量 {formatBytes(totalTraffic)}</span>
                </div>
              </div>

              <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                <div className='rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
                  <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
                    <Zap className='size-3.5 text-primary' /> 已用流量
                  </div>
                  <div className='mt-2 text-xl font-semibold text-slate-900 dark:text-foreground'>{formatBytes(usedTraffic)}</div>
                  <div className='mt-1 text-xs text-slate-500 dark:text-muted-foreground'>{usageDelta}</div>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
                  <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
                    <TrendingUp className='size-3.5 text-emerald-500' /> 剩余流量
                  </div>
                  <div className='mt-2 text-xl font-semibold text-slate-900 dark:text-foreground'>{formatBytes(remainingTraffic)}</div>
                  <div className='mt-1 text-xs text-slate-500 dark:text-muted-foreground'>仍可继续使用的配额</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className='space-y-4 px-4 pt-5 lg:px-6 lg:pt-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='space-y-2'>
            <Badge variant='outline' className='rounded-full border-slate-200/80 bg-white/80 px-2.5 py-1 text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
              补充指标
            </Badge>
            <div>
              <h2 className='text-lg font-semibold tracking-tight text-slate-900 dark:text-foreground'>账户提醒与周期信息</h2>
              <p className='mt-1 text-sm text-slate-500 dark:text-muted-foreground'>补充查看返利、总配额、重置时间与通知设置。</p>
            </div>
          </div>
        </div>

        <Suspense fallback={<DashboardMetricSectionSkeleton />}>
          <SectionCards />
        </Suspense>
      </section>

      <section className='space-y-4 px-4 pb-2 pt-6 lg:px-6 lg:pt-7'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='space-y-2'>
            <Badge variant='outline' className='rounded-full border-slate-200/80 bg-white/80 px-2.5 py-1 text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
              真实流量日志
            </Badge>
            <div>
              <h2 className='text-lg font-semibold tracking-tight text-slate-900 dark:text-foreground'>使用趋势与摘要</h2>
              <p className='mt-1 text-sm text-slate-500 dark:text-muted-foreground'>趋势图与周摘要均来自真实流量日志接口，不再使用前端推演数据。</p>
            </div>
          </div>
        </div>

        {trafficLogsQuery.isError ? (
          <Card className='border-rose-200/80 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-500/10'>
            <CardContent className='p-4 text-sm text-rose-700 dark:text-rose-200'>
              真实流量日志加载失败，暂时无法展示最近一周摘要与趋势图。
            </CardContent>
          </Card>
        ) : null}

        <Suspense fallback={<DashboardChartsSkeleton />}>
          <div className='grid min-w-0 gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
            <ChartAreaInteractive trafficLogs={trafficLogs} updatedAtLabel={dashboardUpdatedAtLabel} />
            <TrafficWeeklySummary trafficLogs={trafficLogs} />
          </div>
        </Suspense>
      </section>
    </>
  )
}
