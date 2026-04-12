import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Activity, ArrowDownToLine, ArrowUpToLine, Database } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { formatBytes } from '@/lib/format'
import type { TrafficLog } from '@/lib/api/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'

type ChartAreaInteractiveProps = {
  trafficLogs: TrafficLog[]
  updatedAtLabel: string
  metaChipClassName?: string
}

type DailyTrafficPoint = {
  date: string
  upload: number
  download: number
  total: number
}

const chartConfig = {
  traffic: {
    label: 'Traffic',
  },
  download: {
    label: '下载',
    color: 'var(--chart-1)',
  },
  upload: {
    label: '上传',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function getDayKey(timestamp: number) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10)
}

function buildDailyTraffic(logs: TrafficLog[]) {
  const grouped = new Map<string, DailyTrafficPoint>()

  for (const log of logs) {
    if (!log.record_at) continue
    const dayKey = getDayKey(log.record_at)
    const current = grouped.get(dayKey) ?? { date: dayKey, upload: 0, download: 0, total: 0 }
    current.upload += log.upload
    current.download += log.download
    current.total += log.total
    grouped.set(dayKey, current)
  }

  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function formatTrafficCompact(value: number) {
  return formatBytes(value)
}

export function ChartAreaInteractive({ trafficLogs, updatedAtLabel, metaChipClassName = 'inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[11px] text-slate-600 transition-colors hover:bg-slate-50 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground dark:hover:bg-background/50' }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState('30d')

  React.useEffect(() => {
    if (isMobile) setTimeRange('7d')
  }, [isMobile])

  const dailyData = React.useMemo(() => buildDailyTraffic(trafficLogs), [trafficLogs])

  const filteredData = React.useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30
    return dailyData.slice(-Math.min(days, dailyData.length))
  }, [dailyData, timeRange])

  const totals = filteredData.reduce(
    (acc, item) => {
      acc.download += item.download
      acc.upload += item.upload
      return acc
    },
    { download: 0, upload: 0 },
  )

  const peak = filteredData.reduce(
    (best, item) => (item.total > best.total ? item : best),
    filteredData[0] ?? { date: '--', upload: 0, download: 0, total: 0 },
  )

  const averageDaily = filteredData.length > 0 ? filteredData.reduce((sum, item) => sum + item.total, 0) / filteredData.length : 0
  const hasData = filteredData.length > 0

  return (
    <Card className='@container/card overflow-hidden border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.92))] shadow-sm dark:border-border/70 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.92))]'>
      <CardHeader className='min-w-0 gap-4 border-b border-slate-200/70 pb-5 dark:border-border/60'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
          <div className='min-w-0 space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary'>
                <Database className='size-3.5' />
                真实流量趋势
              </Badge>
              <Badge variant='outline' className='rounded-full px-3 py-1'>
                <Activity className='size-3.5' />
                最近 {timeRange === '30d' ? '30 天' : timeRange === '14d' ? '14 天' : '7 天'}
              </Badge>
            </div>
            <div className='min-w-0 space-y-2'>
              <CardTitle>下载 / 上传</CardTitle>
              <div className='flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground'>
                <span className={metaChipClassName}>最近更新 {updatedAtLabel}</span>
              </div>
            </div>
          </div>

          <div className='flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:justify-end'>
            <ToggleGroup
              type='single'
              value={timeRange}
              onValueChange={(value) => value && setTimeRange(value)}
              variant='outline'
              className='hidden rounded-full bg-white/80 p-1 *:data-[slot=toggle-group-item]:rounded-full *:data-[slot=toggle-group-item]:px-4! xl:flex dark:bg-background/35'
            >
              <ToggleGroupItem value='30d'>30 天</ToggleGroupItem>
              <ToggleGroupItem value='14d'>14 天</ToggleGroupItem>
              <ToggleGroupItem value='7d'>7 天</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className='flex w-full min-w-0 rounded-full bg-white/85 sm:w-32 xl:hidden dark:bg-background/35' size='sm' aria-label='Select a value'>
                <SelectValue placeholder='30 天' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='30d' className='rounded-lg'>30 天</SelectItem>
                <SelectItem value='14d' className='rounded-lg'>14 天</SelectItem>
                <SelectItem value='7d' className='rounded-lg'>7 天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          <div className='rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
            <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
              <ArrowDownToLine className='size-4 text-[var(--color-download)]' /> 下载总量
            </div>
            <div className='mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(totals.download)}</div>
            <div className='mt-1 text-sm text-slate-500 dark:text-muted-foreground'>所选时间范围内真实下载日志汇总</div>
          </div>

          <div className='rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
            <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
              <ArrowUpToLine className='size-4 text-[var(--color-upload)]' /> 上传总量
            </div>
            <div className='mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(totals.upload)}</div>
            <div className='mt-1 text-sm text-slate-500 dark:text-muted-foreground'>所选时间范围内真实上传日志汇总</div>
          </div>

          <div className='rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
            <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
              <Activity className='size-4 text-primary' /> 峰值 / 日均
            </div>
            <div className='mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(peak.total)}</div>
            <div className='mt-1 text-sm text-slate-500 dark:text-muted-foreground'>峰值 {peak.date} · 日均 {formatTrafficCompact(averageDaily)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='min-w-0 overflow-hidden px-3 pt-5 sm:px-6'>
        {hasData ? (
          <ChartContainer config={chartConfig} className='aspect-auto h-[320px] w-full min-w-0'>
            <AreaChart data={filteredData} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id='fillDownload' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-download)' stopOpacity={0.95} />
                  <stop offset='95%' stopColor='var(--color-download)' stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id='fillUpload' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-upload)' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='var(--color-upload)' stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator='dot'
                    formatter={(value) => formatTrafficCompact(Number(value))}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                      })
                    }
                  />
                }
              />
              <Area dataKey='download' type='natural' fill='url(#fillDownload)' stroke='var(--color-download)' stackId='a' strokeWidth={2} />
              <Area dataKey='upload' type='natural' fill='url(#fillUpload)' stroke='var(--color-upload)' stackId='a' strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className='flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/60 text-sm text-slate-500 dark:border-border/60 dark:bg-background/25 dark:text-muted-foreground'>
            当前没有可用的真实流量日志数据
          </div>
        )}
      </CardContent>
    </Card>
  )
}
