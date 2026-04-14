import * as React from 'react'
import { TrendingUp } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'
import type { TrafficLog } from '@/lib/api/types'

type TrafficWeeklySummaryProps = {
  trafficLogs: TrafficLog[]
}

type WeeklyTrafficChartItem = {
  dateKey: string
  day: string
  fullLabel: string
  traffic: number
}

function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getWeekdayLabel(date: Date) {
  const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' })
  return weekday.replace('星期', '周')
}

function getFullDateLabel(date: Date) {
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  })
}

function aggregateDailyMap(trafficLogs: TrafficLog[]) {
  const dailyMap = new Map<string, number>()

  for (const log of trafficLogs) {
    if (!log.record_at) continue
    const dayKey = new Date(log.record_at * 1000).toISOString().slice(0, 10)
    dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + log.total)
  }

  return dailyMap
}

function buildRecentWeekData(trafficLogs: TrafficLog[]) {
  const dailyMap = aggregateDailyMap(trafficLogs)
  const today = new Date()
  const days: WeeklyTrafficChartItem[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setHours(0, 0, 0, 0)
    day.setDate(today.getDate() - offset)
    const dayKey = getDayKey(day)

    days.push({
      dateKey: dayKey,
      day: getWeekdayLabel(day),
      fullLabel: getFullDateLabel(day),
      traffic: dailyMap.get(dayKey) ?? 0,
    })
  }

  return days
}

function getPreviousWeekTotal(trafficLogs: TrafficLog[]) {
  const dailyMap = aggregateDailyMap(trafficLogs)
  const today = new Date()
  let total = 0

  for (let offset = 13; offset >= 7; offset -= 1) {
    const day = new Date(today)
    day.setHours(0, 0, 0, 0)
    day.setDate(today.getDate() - offset)
    total += dailyMap.get(getDayKey(day)) ?? 0
  }

  return total
}

export function TrafficWeeklySummary({ trafficLogs }: TrafficWeeklySummaryProps) {
  const chartData = buildRecentWeekData(trafficLogs)
  const hasRealData = chartData.some((item) => item.traffic > 0)
  const [activeDateKey, setActiveDateKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    setActiveDateKey((current) => current ?? chartData.find((item) => item.traffic > 0)?.dateKey ?? chartData[chartData.length - 1]?.dateKey ?? null)
  }, [chartData])

  if (!hasRealData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近一周流量使用</CardTitle>
          <CardDescription>Last 7 days of real traffic usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-6 text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>
            最近 7 天暂无真实流量数据
          </div>
        </CardContent>
        <CardFooter className='flex-col items-start gap-2 text-sm'>
          <div className='flex gap-2 leading-none font-medium'>
            本周累计 0 B
            <TrendingUp className='h-4 w-4' />
          </div>
          <div className='leading-none text-muted-foreground'>
            Showing real usage totals for the last 7 days when data becomes available
          </div>
        </CardFooter>
      </Card>
    )
  }

  const currentWeekTotal = chartData.reduce((sum, item) => sum + item.traffic, 0)
  const previousWeekTotal = getPreviousWeekTotal(trafficLogs)
  const diffRatio = previousWeekTotal > 0 ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100 : null
  const peakDay = chartData.reduce(
    (best, item) => (item.traffic > best.traffic ? item : best),
    chartData[0] ?? { dateKey: '--', day: '--', fullLabel: '--', traffic: 0 },
  )
  const maxTraffic = Math.max(...chartData.map((item) => item.traffic), 0)
  const activeItem = chartData.find((item) => item.dateKey === activeDateKey) ?? peakDay

  return (
    <Card className='min-w-0 overflow-hidden'>
      <CardHeader className='min-w-0'>
        <CardTitle>最近一周流量使用</CardTitle>
        <CardDescription>Last 7 days of real traffic usage</CardDescription>
      </CardHeader>
      <CardContent className='min-w-0 overflow-hidden'>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <div className='inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1 text-[11px] text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-border/70 dark:bg-background/45 dark:text-slate-300'>
            <span className='size-2 rounded-full bg-[var(--chart-1)]' />
            焦点 {activeItem.fullLabel}
          </div>
          <div className='inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1 text-[11px] text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-border/70 dark:bg-background/45 dark:text-slate-300'>
            峰值 {formatBytes(peakDay.traffic)}
          </div>
        </div>
        <div className='grid gap-3'>
          {chartData.map((item) => {
            const ratio = maxTraffic > 0 ? item.traffic / maxTraffic : 0
            const barWidth = Math.max(ratio * 100, item.traffic > 0 ? 8 : 0)
            const active = item.dateKey === activeItem.dateKey
            const peak = item.dateKey === peakDay.dateKey

            return (
              <button
                key={item.dateKey}
                type='button'
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border px-2.5 py-2 text-left transition-all duration-200',
                  active
                    ? 'border-slate-300/90 bg-white/90 shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:border-border dark:bg-background/45'
                    : 'border-transparent hover:border-slate-200/80 hover:bg-white/60 dark:hover:border-border/70 dark:hover:bg-background/25'
                )}
                onMouseEnter={() => setActiveDateKey(item.dateKey)}
                onFocus={() => setActiveDateKey(item.dateKey)}
              >
                <div className={cn('w-11 text-xs font-medium', active ? 'text-slate-900 dark:text-foreground' : 'text-slate-500 dark:text-muted-foreground')}>{item.day}</div>
                <div className='min-w-0'>
                  <div className='flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-muted-foreground'>
                    <span className='truncate'>{item.fullLabel}</span>
                    <span className='shrink-0 font-medium tabular-nums text-slate-700 dark:text-slate-200'>{formatBytes(item.traffic)}</span>
                  </div>
                  <div className='mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width,filter] duration-200 bg-[linear-gradient(90deg,var(--chart-1),rgba(59,130,246,0.72))]',
                        active && 'shadow-[0_0_0_1px_rgba(59,130,246,0.2)] saturate-125',
                        peak && 'ring-1 ring-sky-200/70 dark:ring-sky-400/20'
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className='mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-muted-foreground'>
                    <span>{peak ? '本周峰值' : active ? '当前焦点' : '日流量'}</span>
                    <span>{Math.round(ratio * 100)}%</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
      <CardFooter className='min-w-0 flex-col items-start gap-2 text-sm'>
        <div className='flex flex-wrap gap-2 leading-none font-medium'>
          {diffRatio == null
            ? `本周累计 ${formatBytes(currentWeekTotal)}`
            : `较上周 ${diffRatio >= 0 ? '增长' : '下降'} ${Math.abs(diffRatio).toFixed(1)}%`}
          <TrendingUp className='h-4 w-4' />
        </div>
        <div className='break-words leading-none text-muted-foreground'>
          {`Showing real usage totals · 峰值 ${peakDay.fullLabel}`}
        </div>
      </CardFooter>
    </Card>
  )
}
