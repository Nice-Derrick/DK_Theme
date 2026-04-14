import * as React from 'react'
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

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  })
}

function formatAxisDate(value: string, compact = false) {
  const date = new Date(value)
  return date.toLocaleDateString('zh-CN', compact ? {
    month: 'numeric',
    day: 'numeric',
  } : {
    month: '2-digit',
    day: '2-digit',
  })
}

function createLinePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function createAreaPath(points: { x: number; y: number }[], baselineY: number) {
  if (points.length === 0) return ''
  const linePath = createLinePath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

function buildChartGeometry(data: DailyTrafficPoint[], width: number, height: number) {
  const padding = { top: 18, right: 2, bottom: 30, left: 2 }
  const chartWidth = Math.max(width - padding.left - padding.right, 1)
  const chartHeight = Math.max(height - padding.top - padding.bottom, 1)
  const maxValue = Math.max(...data.flatMap((item) => [item.download, item.upload]), 0)
  const safeMax = maxValue > 0 ? maxValue : 1
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0
  const baselineY = padding.top + chartHeight

  const points = data.map((item, index) => {
    const x = padding.left + (data.length > 1 ? stepX * index : chartWidth / 2)
    const downloadY = padding.top + chartHeight - (item.download / safeMax) * chartHeight
    const uploadY = padding.top + chartHeight - (item.upload / safeMax) * chartHeight

    return {
      ...item,
      x,
      downloadY,
      uploadY,
    }
  })

  return {
    padding,
    chartWidth,
    chartHeight,
    baselineY,
    maxValue: safeMax,
    points,
    gridValues: [0.25, 0.5, 0.75, 1],
  }
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
  const chartData = React.useMemo(() => buildChartGeometry(filteredData, 760, 320), [filteredData])
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  React.useEffect(() => {
    setHoveredIndex(filteredData.length > 0 ? filteredData.length - 1 : null)
  }, [filteredData])

  const activeIndex = hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < chartData.points.length
    ? hoveredIndex
    : chartData.points.length > 0
      ? chartData.points.length - 1
      : null
  const activePoint = activeIndex != null ? chartData.points[activeIndex] : null
  const activeMax = activePoint ? Math.max(activePoint.download, activePoint.upload, 1) : 1
  const activeDownloadShare = activePoint ? Math.round((activePoint.download / activeMax) * 100) : 0
  const activeUploadShare = activePoint ? Math.round((activePoint.upload / activeMax) * 100) : 0
  const downloadLinePath = createLinePath(chartData.points.map((point) => ({ x: point.x, y: point.downloadY })))
  const uploadLinePath = createLinePath(chartData.points.map((point) => ({ x: point.x, y: point.uploadY })))
  const downloadAreaPath = createAreaPath(chartData.points.map((point) => ({ x: point.x, y: point.downloadY })), chartData.baselineY)
  const uploadAreaPath = createAreaPath(chartData.points.map((point) => ({ x: point.x, y: point.uploadY })), chartData.baselineY)
  const tickIndexes = chartData.points.length <= (isMobile ? 4 : 6)
    ? chartData.points.map((_, index) => index)
    : Array.from(new Set(isMobile
      ? [0, Math.floor((chartData.points.length - 1) * 0.5), chartData.points.length - 1]
      : [0, Math.floor((chartData.points.length - 1) * 0.25), Math.floor((chartData.points.length - 1) * 0.5), Math.floor((chartData.points.length - 1) * 0.75), chartData.points.length - 1]))

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

        <div className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-3'>
          <div className='min-w-0 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
            <div className='flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-muted-foreground'>
              <ArrowDownToLine className='size-4 shrink-0 text-[var(--chart-1)]' />
              <span>下载总量</span>
            </div>
            <div className='mt-2 break-all text-2xl font-semibold tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(totals.download)}</div>
            <div className='mt-1 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>所选时间范围内真实下载日志汇总</div>
          </div>

          <div className='min-w-0 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35'>
            <div className='flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-muted-foreground'>
              <ArrowUpToLine className='size-4 shrink-0 text-[var(--chart-2)]' />
              <span>上传总量</span>
            </div>
            <div className='mt-2 break-all text-2xl font-semibold tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(totals.upload)}</div>
            <div className='mt-1 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>所选时间范围内真实上传日志汇总</div>
          </div>

          <div className='min-w-0 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-border/70 dark:bg-background/35 sm:col-span-2 2xl:col-span-1'>
            <div className='flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-muted-foreground'>
              <Activity className='size-4 shrink-0 text-primary' />
              <span>峰值 / 日均</span>
            </div>
            <div className='mt-2 break-all text-2xl font-semibold tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(peak.total)}</div>
            <div className='mt-1 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>峰值 {peak.date} · 日均 {formatTrafficCompact(averageDaily)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='min-w-0 overflow-hidden px-2 pt-5 sm:px-4'>
        {hasData ? (
          <div className='min-w-0'>
            <div className='mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-muted-foreground'>
              <span className='inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-border/70 dark:bg-background/35'>
                <span className='size-2.5 rounded-full bg-[var(--chart-1)]' />
                下载
              </span>
              <span className='inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-border/70 dark:bg-background/35'>
                <span className='size-2.5 rounded-full bg-[var(--chart-2)]' />
                上传
              </span>
              {activePoint ? (
                <span className='inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-border/70 dark:bg-background/45'>
                  {formatLongDate(activePoint.date)} · 总量 {formatTrafficCompact(activePoint.total)}
                </span>
              ) : null}
            </div>

            <div className='relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.78))] px-1.5 py-3 dark:border-border/60 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(15,23,42,0.22))] sm:px-2 sm:py-4'>
              {activePoint ? (
                <div className='pointer-events-none absolute right-4 top-4 z-10 hidden w-[188px] rounded-[22px] border border-slate-200/80 bg-white/88 p-3 text-xs shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:block dark:border-border/70 dark:bg-slate-950/78'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='font-medium text-slate-900 dark:text-foreground'>{formatLongDate(activePoint.date)}</div>
                      <div className='mt-0.5 text-[11px] text-slate-500 dark:text-muted-foreground'>总量 {formatTrafficCompact(activePoint.total)}</div>
                    </div>
                    <div className='rounded-full border border-slate-200/80 bg-slate-50/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-border/70 dark:bg-background/40 dark:text-slate-300'>
                      实时
                    </div>
                  </div>
                  <div className='mt-3 space-y-2'>
                    <div>
                      <div className='mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-muted-foreground'>
                        <span className='inline-flex items-center gap-1.5'><span className='size-2 rounded-full bg-[var(--chart-1)]' />下载</span>
                        <span className='font-medium tabular-nums text-slate-800 dark:text-slate-100'>{formatTrafficCompact(activePoint.download)}</span>
                      </div>
                      <div className='h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                        <div className='h-full rounded-full bg-[var(--chart-1)]/90' style={{ width: `${activeDownloadShare}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className='mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-muted-foreground'>
                        <span className='inline-flex items-center gap-1.5'><span className='size-2 rounded-full bg-[var(--chart-2)]' />上传</span>
                        <span className='font-medium tabular-nums text-slate-800 dark:text-slate-100'>{formatTrafficCompact(activePoint.upload)}</span>
                      </div>
                      <div className='h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                        <div className='h-full rounded-full bg-[var(--chart-2)]/90' style={{ width: `${activeUploadShare}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activePoint ? (
                <div className='mb-3 rounded-2xl border border-slate-200/80 bg-white/88 p-3 text-xs shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:hidden dark:border-border/70 dark:bg-slate-950/70'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='font-medium text-slate-900 dark:text-foreground'>{formatLongDate(activePoint.date)}</div>
                    <div className='text-[11px] text-slate-500 dark:text-muted-foreground'>总量 {formatTrafficCompact(activePoint.total)}</div>
                  </div>
                  <div className='mt-2 grid grid-cols-2 gap-2'>
                    <div className='rounded-xl bg-slate-50/80 px-2.5 py-2 dark:bg-background/35'>
                      <div className='text-[10px] text-slate-500 dark:text-muted-foreground'>下载</div>
                      <div className='mt-1 font-medium tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(activePoint.download)}</div>
                    </div>
                    <div className='rounded-xl bg-slate-50/80 px-2.5 py-2 dark:bg-background/35'>
                      <div className='text-[10px] text-slate-500 dark:text-muted-foreground'>上传</div>
                      <div className='mt-1 font-medium tabular-nums text-slate-900 dark:text-foreground'>{formatTrafficCompact(activePoint.upload)}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <svg viewBox='0 0 760 320' className='h-[320px] w-full min-w-0' role='img' aria-label='最近流量趋势图' onMouseLeave={() => setHoveredIndex(chartData.points.length > 0 ? chartData.points.length - 1 : null)}>
                <defs>
                  <linearGradient id='dashboard-download-fill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='var(--chart-1)' stopOpacity='0.22' />
                    <stop offset='60%' stopColor='var(--chart-1)' stopOpacity='0.08' />
                    <stop offset='100%' stopColor='var(--chart-1)' stopOpacity='0.02' />
                  </linearGradient>
                  <linearGradient id='dashboard-upload-fill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='var(--chart-2)' stopOpacity='0.18' />
                    <stop offset='60%' stopColor='var(--chart-2)' stopOpacity='0.07' />
                    <stop offset='100%' stopColor='var(--chart-2)' stopOpacity='0.02' />
                  </linearGradient>
                  <filter id='dashboard-soft-glow' x='-20%' y='-20%' width='140%' height='140%'>
                    <feGaussianBlur stdDeviation='6' result='blur' />
                    <feMerge>
                      <feMergeNode in='blur' />
                      <feMergeNode in='SourceGraphic' />
                    </feMerge>
                  </filter>
                </defs>

                {chartData.gridValues.map((ratio) => {
                  const y = chartData.padding.top + chartData.chartHeight - chartData.chartHeight * ratio
                  return (
                    <line
                      key={ratio}
                      x1={chartData.padding.left}
                      x2={760 - chartData.padding.right}
                      y1={y}
                      y2={y}
                      stroke='currentColor'
                      strokeDasharray='4 6'
                      className='text-slate-200/90 dark:text-white/10'
                    />
                  )
                })}

                <line
                  x1={chartData.padding.left}
                  x2={760 - chartData.padding.right}
                  y1={chartData.baselineY}
                  y2={chartData.baselineY}
                  stroke='currentColor'
                  className='text-slate-200/90 dark:text-white/12'
                />

                {activePoint ? (
                  <rect
                    x={Math.max(activePoint.x - (isMobile ? 18 : 22), chartData.padding.left)}
                    y={chartData.padding.top}
                    width={isMobile ? 36 : 44}
                    height={chartData.chartHeight}
                    rx={18}
                    fill='currentColor'
                    className='text-sky-100/45 dark:text-white/6'
                  />
                ) : null}

                {downloadAreaPath ? <path d={downloadAreaPath} fill='url(#dashboard-download-fill)' /> : null}
                {uploadAreaPath ? <path d={uploadAreaPath} fill='url(#dashboard-upload-fill)' /> : null}
                {downloadLinePath ? <path d={downloadLinePath} fill='none' stroke='var(--chart-1)' strokeOpacity='0.24' strokeWidth='7' strokeLinejoin='round' strokeLinecap='round' filter='url(#dashboard-soft-glow)' /> : null}
                {uploadLinePath ? <path d={uploadLinePath} fill='none' stroke='var(--chart-2)' strokeOpacity='0.18' strokeWidth='7' strokeLinejoin='round' strokeLinecap='round' filter='url(#dashboard-soft-glow)' /> : null}
                {downloadLinePath ? <path d={downloadLinePath} fill='none' stroke='var(--chart-1)' strokeWidth='3' strokeLinejoin='round' strokeLinecap='round' /> : null}
                {uploadLinePath ? <path d={uploadLinePath} fill='none' stroke='var(--chart-2)' strokeWidth='3' strokeLinejoin='round' strokeLinecap='round' /> : null}

                {chartData.points.map((point, index) => {
                  const active = index === activeIndex
                  return (
                    <g key={point.date}>
                      {active ? (
                        <line
                          x1={point.x}
                          x2={point.x}
                          y1={chartData.padding.top}
                          y2={chartData.baselineY}
                          stroke='currentColor'
                          strokeDasharray='5 5'
                          className='text-slate-300/90 dark:text-white/20'
                        />
                      ) : null}
                      {active ? <circle cx={point.x} cy={point.downloadY} r='10' fill='var(--chart-1)' fillOpacity='0.16' /> : null}
                      {active ? <circle cx={point.x} cy={point.uploadY} r='10' fill='var(--chart-2)' fillOpacity='0.14' /> : null}
                      <circle cx={point.x} cy={point.downloadY} r={active ? 5.5 : 3.5} fill='var(--chart-1)' stroke='white' strokeWidth={active ? '2.5' : '2'} />
                      <circle cx={point.x} cy={point.uploadY} r={active ? 5.5 : 3.5} fill='var(--chart-2)' stroke='white' strokeWidth={active ? '2.5' : '2'} />
                    </g>
                  )
                })}

                {tickIndexes.map((index, tickPosition) => {
                  const point = chartData.points[index]
                  const textAnchor = tickPosition === 0 ? 'start' : tickPosition === tickIndexes.length - 1 ? 'end' : 'middle'
                  const x = tickPosition === 0
                    ? Math.max(point.x, chartData.padding.left)
                    : tickPosition === tickIndexes.length - 1
                      ? Math.min(point.x, 760 - chartData.padding.right)
                      : point.x

                  return (
                    <text
                      key={point.date}
                      x={x}
                      y={304}
                      textAnchor={textAnchor}
                      className='fill-slate-500 text-[11px] dark:fill-slate-400'
                    >
                      {formatAxisDate(point.date, isMobile)}
                    </text>
                  )
                })}

                {chartData.points.map((point, index) => {
                  const nextX = chartData.points[index + 1]?.x ?? point.x + (index > 0 ? point.x - chartData.points[index - 1].x : 28)
                  const prevX = chartData.points[index - 1]?.x ?? point.x - (nextX - point.x)
                  const x = prevX + (point.x - prevX) / 2
                  const width = Math.max((nextX - prevX) / 2, 24)

                  return (
                    <rect
                      key={`${point.date}-hitbox`}
                      x={x}
                      y={0}
                      width={width}
                      height={320}
                      fill='transparent'
                      onMouseEnter={() => setHoveredIndex(index)}
                      onFocus={() => setHoveredIndex(index)}
                      onClick={() => setHoveredIndex(index)}
                    />
                  )
                })}
              </svg>
            </div>
          </div>
        ) : (
          <div className='flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/60 text-sm text-slate-500 dark:border-border/60 dark:bg-background/25 dark:text-muted-foreground'>
            当前没有可用的真实流量日志数据
          </div>
        )}
      </CardContent>
    </Card>
  )
}
