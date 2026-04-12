import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
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

const chartConfig = {
  traffic: {
    label: '流量',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

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

  return (
    <Card className='min-w-0 overflow-hidden'>
      <CardHeader className='min-w-0'>
        <CardTitle>最近一周流量使用</CardTitle>
        <CardDescription>Last 7 days of real traffic usage</CardDescription>
      </CardHeader>
      <CardContent className='min-w-0 overflow-hidden'>
        <ChartContainer config={chartConfig} className='aspect-auto min-h-[240px] h-[240px] w-full min-w-0'>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout='vertical'
            margin={{ left: -32, right: 0, top: 4, bottom: 4 }}
          >
            <XAxis type='number' dataKey='traffic' hide />
            <YAxis
              dataKey='day'
              type='category'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 2)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const payload = item.payload as WeeklyTrafficChartItem
                    return (
                      <div className='flex min-w-0 max-w-[220px] flex-col gap-1 sm:min-w-[140px] sm:max-w-none sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
                        <span className='break-words'>{payload.fullLabel}</span>
                        <span className='font-medium tabular-nums'>{formatBytes(Number(value))}</span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Bar dataKey='traffic' fill='var(--color-traffic)' radius={5} />
          </BarChart>
        </ChartContainer>
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
