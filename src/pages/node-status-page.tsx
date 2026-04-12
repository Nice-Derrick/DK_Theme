import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, CircleOff, LayoutGrid, List, RefreshCw, ServerCog, Tags } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getNodeStatuses } from '@/lib/api/services/node-status'
import type { NodeStatus } from '@/lib/api/types'
import { appConfig } from '@/lib/config'
import { formatDateTime } from '@/lib/format'

type NodeFilter = 'all' | 'online' | 'offline' | 'tagged'
type NodeSort = 'status' | 'name' | 'rate' | 'checked'
type NodeViewMode = 'card' | 'list'

const filterOptions: Array<{ key: NodeFilter; label: string }> = [
  { key: 'all', label: '全部节点' },
  { key: 'online', label: '仅看可用' },
  { key: 'offline', label: '仅看异常' },
  { key: 'tagged', label: '仅看有标签' },
]

const sortOptions: Array<{ key: NodeSort; label: string }> = [
  { key: 'status', label: '按状态排序' },
  { key: 'name', label: '按名称排序' },
  { key: 'rate', label: '按倍率排序' },
  { key: 'checked', label: '按检测时间排序' },
]

function getProtocolLabel(node: NodeStatus) {
  const protocol = (node.group ?? '').toLowerCase()

  switch (protocol) {
    case 'shadowsocks':
      return 'Shadowsocks'
    case 'vless':
      return 'VLESS'
    case 'vmess':
      return 'VMess'
    case 'trojan':
      return 'Trojan'
    case 'hysteria':
      return 'Hysteria'
    case 'hysteria2':
      return 'Hysteria 2'
    case 'tuic':
      return 'TUIC'
    case 'wireguard':
      return 'WireGuard'
    case 'ssh':
      return 'SSH'
    default:
      return node.group ?? '未标注协议'
  }
}

function getRegionBadge(node: NodeStatus) {
  const text = `${node.location ?? ''} ${node.name}`

  if (/🇭🇰|香港/i.test(text)) return { code: 'hk', label: '中国香港' }
  if (/🇯🇵|日本/i.test(text)) return { code: 'jp', label: '日本' }
  if (/🇸🇬|新加坡/i.test(text)) return { code: 'sg', label: '新加坡' }
  if (/🇺🇸|美国/i.test(text)) return { code: 'us', label: '美国' }
  if (/🇹🇼|台湾/i.test(text)) return { code: 'tw', label: '中国台湾' }
  if (/🇰🇷|韩国/i.test(text)) return { code: 'kr', label: '韩国' }
  if (/🇬🇧|英国/i.test(text)) return { code: 'gb', label: '英国' }
  if (/🇩🇪|德国/i.test(text)) return { code: 'de', label: '德国' }
  return null
}

function RegionFlag({ code, label, className = 'h-7 w-9' }: { code: string; label: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[8px] border border-black/8 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-black/5 dark:border-white/10 dark:bg-white/8 dark:shadow-none dark:ring-white/10 ${className}`}
      aria-label={label}
      title={label}
    >
      <span className={`fib fi-${code} block h-full w-full`} aria-hidden='true' />
    </span>
  )
}

function stripLeadingFlagEmoji(name: string) {
  return name.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').trim()
}

function formatNodeDisplayName(name: string) {
  return stripLeadingFlagEmoji(name)
    .replace(/Ai/g, 'AI')
    .replace(/(\d+(?:\.\d+)?)倍/g, '$1 倍')
    .replace(/专线-(\d+)/g, '专线 $1')
    .replace(/专线(\d+)-(\d+)/g, '专线 $1-$2')
    .replace(/[_-]/g, ' · ')
    .replace(/\s+/g, ' ')
    .replace(/ ·  /g, ' · ')
    .trim()
}

function getNodeLocationText(node: NodeStatus) {
  if (node.location?.trim()) return node.location.trim()
  return getRegionBadge(node)?.label ?? '地区待补充'
}

function getTagBadgeClass(tag: string) {
  const value = tag.toLowerCase()
  if (value.includes('netflix')) {
    return 'border-[#E50914]/20 bg-[#E50914]/10 text-[#E50914] dark:border-[#E50914]/35 dark:bg-[#E50914]/15 dark:text-[#ff6b72]'
  }
  if (value.includes('chatgpt')) {
    return 'border-[#10A37F]/20 bg-[#10A37F]/10 text-[#10A37F] dark:border-[#10A37F]/35 dark:bg-[#10A37F]/15 dark:text-[#53d3b2]'
  }
  if (value.includes('claude')) {
    return 'border-[#D97706]/20 bg-[#D97706]/10 text-[#D97706] dark:border-[#D97706]/35 dark:bg-[#D97706]/15 dark:text-[#f3aa4c]'
  }
  if (value.includes('youtube')) {
    return 'border-[#FF0033]/20 bg-[#FF0033]/10 text-[#FF0033] dark:border-[#FF0033]/35 dark:bg-[#FF0033]/15 dark:text-[#ff6b86]'
  }
  if (value.includes('disney')) {
    return 'border-[#113CCF]/20 bg-[#113CCF]/10 text-[#113CCF] dark:border-[#113CCF]/35 dark:bg-[#113CCF]/15 dark:text-[#7a97ff]'
  }
  if (value.includes('gemini')) {
    return 'border-[#6D5EF5]/20 bg-[#6D5EF5]/10 text-[#6D5EF5] dark:border-[#6D5EF5]/35 dark:bg-[#6D5EF5]/15 dark:text-[#a99cff]'
  }
  if (value.includes('prime')) {
    return 'border-[#00A8E1]/20 bg-[#00A8E1]/10 text-[#0077b6] dark:border-[#00A8E1]/35 dark:bg-[#00A8E1]/15 dark:text-[#73d9ff]'
  }
  if (value.includes('spotify')) {
    return 'border-[#1DB954]/20 bg-[#1DB954]/10 text-[#1DB954] dark:border-[#1DB954]/35 dark:bg-[#1DB954]/15 dark:text-[#66ec97]'
  }
  if (value.includes('bbc') || value.includes('hbo') || value.includes('abema') || value.includes('wavve') || value.includes('niconico') || value.includes('tiktok')) {
    return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300'
  }
  if (value.includes('低延迟') || value.includes('稳定') || value.includes('办公') || value.includes('游戏') || value.includes('低倍率') || value.includes('4k')) {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300'
  }
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-border/70 dark:bg-background/60 dark:text-slate-200'
}

function formatRelativeCheckTime(timestamp?: number | null) {
  if (!timestamp) return '暂无检测记录'

  const diff = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  if (diff < 60) return '刚刚检测'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

function getNodeStatusLabel(node: NodeStatus) {
  return node.online ? '在线' : '异常'
}

function getNodeStatusSummary(node: NodeStatus) {
  return node.online ? '节点可用，可正常分配到订阅。' : '节点当前异常，建议暂时切换其他节点。'
}

function formatRate(rate?: number | null) {
  if (rate == null) return '--'
  return `${rate.toFixed(2)} x`
}

function matchesFilter(node: NodeStatus, filter: NodeFilter) {
  switch (filter) {
    case 'online':
      return node.online
    case 'offline':
      return !node.online
    case 'tagged':
      return Boolean(node.tags?.length)
    default:
      return true
  }
}

function sortNodes(nodes: NodeStatus[], sortBy: NodeSort) {
  return [...nodes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name, 'zh-CN')
      case 'rate':
        return (a.rate ?? Number.POSITIVE_INFINITY) - (b.rate ?? Number.POSITIVE_INFINITY)
      case 'checked':
        return (b.last_checked ?? 0) - (a.last_checked ?? 0)
      case 'status':
      default:
        if (a.online !== b.online) return a.online ? -1 : 1
        return a.name.localeCompare(b.name, 'zh-CN')
    }
  })
}

export function NodeStatusPage() {
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<NodeFilter>('all')
  const [sortBy, setSortBy] = useState<NodeSort>('status')
  const [viewMode, setViewMode] = useState<NodeViewMode>('card')

  const nodeStatusQuery = useQuery({
    queryKey: ['node-status'],
    queryFn: getNodeStatuses,
    refetchInterval: appConfig.nodeStatus.refreshIntervalMs,
    refetchIntervalInBackground: true,
  })

  const nodes = useMemo(() => sortNodes(nodeStatusQuery.data ?? [], sortBy), [nodeStatusQuery.data, sortBy])
  const search = keyword.trim().toLowerCase()
  const filteredNodes = useMemo(
    () =>
      nodes.filter((node) => {
        const text = [formatNodeDisplayName(node.name), getNodeLocationText(node), getProtocolLabel(node), node.network ?? '', ...(node.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return matchesFilter(node, filter) && (!search || text.includes(search))
      }),
    [filter, nodes, search],
  )

  const onlineCount = nodes.filter((node) => node.online).length
  const offlineCount = nodes.filter((node) => !node.online).length
  const taggedCount = nodes.filter((node) => node.tags?.length).length

  return (
    <div className='space-y-8'>
      <PageHeader
        badge='节点状态'
        title='当前订阅节点真实状态'
        actions={<Badge variant='outline' className='rounded-full border-slate-200/80 bg-white/80 dark:border-border/70 dark:bg-background/35'>每 {Math.round(appConfig.nodeStatus.refreshIntervalMs / 1000)} 秒自动刷新</Badge>}
      />

      <div className='px-4 lg:px-6'>
        <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
          <CardContent className='grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><ServerCog className='size-4' />节点总数</div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{nodes.length}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><Activity className='size-4' />在线节点</div>
              <div className='mt-3 text-2xl font-semibold text-emerald-600 dark:text-emerald-400'>{onlineCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><CircleOff className='size-4' />异常节点</div>
              <div className='mt-3 text-2xl font-semibold text-rose-600 dark:text-rose-400'>{offlineCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><Tags className='size-4' />有标签节点</div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{taggedCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='px-4 lg:px-6'>
        <div>
          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader className='space-y-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <CardTitle>节点列表</CardTitle>
                  <CardDescription>支持按真实字段进行搜索、筛选、排序，并可切换列表式与卡片式查看。</CardDescription>
                </div>
                <div className='grid w-full gap-2 sm:w-auto sm:grid-cols-[auto_auto] sm:items-center sm:justify-end'>
                  <div className='inline-grid min-w-0 grid-cols-2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 sm:min-w-[190px] dark:border-border/70 dark:bg-transparent'>
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      size='sm'
                      className='h-9 w-full justify-center gap-1.5 rounded-xl px-3 whitespace-nowrap'
                      onClick={() => setViewMode('card')}
                    >
                      <LayoutGrid className='size-4 shrink-0' />卡片式
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size='sm'
                      className='h-9 w-full justify-center gap-1.5 rounded-xl px-3 whitespace-nowrap'
                      onClick={() => setViewMode('list')}
                    >
                      <List className='size-4 shrink-0' />列表式
                    </Button>
                  </div>
                  <Button
                    variant='outline'
                    className='h-11 w-full justify-center whitespace-nowrap rounded-full bg-white/90 px-4 sm:w-auto sm:shrink-0 dark:bg-transparent'
                    onClick={() => nodeStatusQuery.refetch()}
                  >
                    <RefreshCw className='size-4 shrink-0' />立即刷新
                  </Button>
                </div>
              </div>

              <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]'>
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder='搜索节点名称、协议类型或标签'
                  className='h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-border/70 dark:bg-background/35'
                />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as NodeSort)}>
                  <SelectTrigger className='h-11 w-full rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-border/70 dark:bg-background/35'>
                    <SelectValue placeholder='选择排序方式' />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((item) => (
                      <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-wrap gap-2'>
                {filterOptions.map((item) => (
                  <Button
                    key={item.key}
                    variant={filter === item.key ? 'default' : 'outline'}
                    className={filter === item.key ? 'rounded-2xl shadow-sm' : 'rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-border/70 dark:bg-background/35'}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent className='space-y-3'>
              {nodeStatusQuery.isError ? (
                <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                  <div className='text-base font-medium text-rose-700 dark:text-rose-300'>节点状态加载失败</div>
                  <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>请检查节点状态接口是否可用，或稍后重新加载。</div>
                  <div className='mt-4'>
                    <Button variant='outline' className='rounded-full bg-white/90 dark:bg-transparent' onClick={() => nodeStatusQuery.refetch()}>
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : nodeStatusQuery.isLoading ? (
                <div className='rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-muted-foreground dark:border-border/70 dark:bg-background/35'>
                  正在获取节点状态…
                </div>
              ) : filteredNodes.length ? (
                viewMode === 'card' ? (
                  <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                    {filteredNodes.map((node) => {
                      const regionBadge = getRegionBadge(node)
                      return (
                        <div
                          key={String(node.id)}
                          className={[
                            'relative flex h-full min-h-[198px] flex-col rounded-2xl border bg-slate-50/80 p-3.5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md dark:bg-background/35',
                            node.online
                              ? 'border-emerald-200/90 hover:border-emerald-300 dark:border-emerald-500/30 dark:hover:border-emerald-400/50'
                              : 'border-rose-200/90 hover:border-rose-300 dark:border-rose-500/30 dark:hover:border-rose-400/50',
                          ].join(' ')}
                        >
                          <div className='absolute right-4 top-4'>
                            <Badge
                              variant={node.online ? 'success' : 'destructive'}
                              className={[
                                'shadow-sm',
                                node.online
                                  ? 'ring-1 ring-emerald-200/80 dark:ring-emerald-400/20'
                                  : 'ring-1 ring-rose-200/80 dark:ring-rose-400/20',
                              ].join(' ')}
                            >
                              {getNodeStatusLabel(node)}
                            </Badge>
                          </div>

                          <div className='flex items-start gap-3 pr-16'>
                            {regionBadge ? <RegionFlag code={regionBadge.code} label={regionBadge.label} className='h-[34px] w-[44px]' /> : null}
                            <div className='min-w-0'>
                              <div className='line-clamp-2 text-[15px] font-semibold leading-5 text-slate-900 dark:text-foreground'>
                                {formatNodeDisplayName(node.name)}
                              </div>
                              <div className='mt-1 text-xs text-muted-foreground'>
                                {getNodeLocationText(node)}
                                <span className='mx-1'>·</span>
                                {getProtocolLabel(node)}
                                {node.network ? <><span className='mx-1'>·</span>{node.network}</> : null}
                              </div>
                            </div>
                          </div>

                          <div className='mt-3 flex flex-wrap gap-2'>
                            {regionBadge ? <Badge variant='secondary'>{regionBadge.label}</Badge> : null}
                            <div className='inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-border/70 dark:bg-background/60 dark:text-foreground'>
                              <span className='text-[10px] uppercase tracking-[0.14em] text-muted-foreground'>Rate</span>
                              <span className='text-sm font-semibold text-slate-900 dark:text-foreground'>{formatRate(node.rate)}</span>
                            </div>
                          </div>

                          <div className={[
                            'mt-3 rounded-xl border bg-white/80 px-3 py-2 text-[11px] text-muted-foreground dark:bg-background/60',
                            node.online
                              ? 'border-emerald-100/90 dark:border-emerald-500/20'
                              : 'border-rose-100/90 dark:border-rose-500/20',
                          ].join(' ')}>
                            <div>{formatRelativeCheckTime(node.last_checked)}</div>
                            <div className='mt-1'>{formatDateTime(node.last_checked)}</div>
                          </div>

                          <div className='mt-3 flex min-h-7 flex-wrap gap-1.5'>
                            {node.tags?.length ? (
                              node.tags.map((tag) => (
                                <Badge key={`${node.id}-${tag}`} variant='outline' className={getTagBadgeClass(tag)}>{tag}</Badge>
                              ))
                            ) : (
                              <span className='text-xs text-muted-foreground'>暂无标签</span>
                            )}
                          </div>

                          <div className='mt-auto pt-3 text-[11px] text-muted-foreground'>
                            {getNodeStatusSummary(node)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  filteredNodes.map((node) => {
                    const regionBadge = getRegionBadge(node)
                    return (
                      <div
                        key={String(node.id)}
                        className='rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-border/70 dark:bg-background/30'
                      >
                        <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
                          <div className='space-y-2.5'>
                            <div className='flex flex-wrap items-center gap-2'>
                              {regionBadge ? <RegionFlag code={regionBadge.code} label={regionBadge.label} className='h-[36px] w-[48px]' /> : null}
                              <div className='break-words text-lg font-semibold text-slate-900 dark:text-foreground'>{formatNodeDisplayName(node.name)}</div>
                              {regionBadge ? <Badge variant='secondary'>{regionBadge.label}</Badge> : null}
                              <Badge variant={node.online ? 'success' : 'destructive'}>{getNodeStatusLabel(node)}</Badge>
                              <Badge variant='outline'>倍率 {formatRate(node.rate)}</Badge>
                            </div>

                            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
                              <span>{getNodeLocationText(node)}</span>
                              <span className='hidden sm:inline'>·</span>
                              <span>协议：{getProtocolLabel(node)}</span>
                              {node.network ? <><span className='hidden sm:inline'>·</span><span>线路：{node.network}</span></> : null}
                              <span className='hidden sm:inline'>·</span>
                              <span>最后检测：{formatRelativeCheckTime(node.last_checked)}</span>
                              <span className='hidden sm:inline'>·</span>
                              <span>{formatDateTime(node.last_checked)}</span>
                            </div>

                            {node.tags?.length ? (
                              <div className='flex flex-wrap gap-2'>
                                {node.tags.map((tag) => <Badge key={`${node.id}-${tag}`} variant='outline' className={getTagBadgeClass(tag)}>{tag}</Badge>)}
                              </div>
                            ) : (
                              <div className='text-sm text-muted-foreground'>暂无标签</div>
                            )}
                          </div>

                          <div className='w-full text-sm text-muted-foreground xl:w-auto xl:max-w-56 xl:text-right'>
                            {getNodeStatusSummary(node)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              ) : (
                <div className='rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-muted-foreground dark:border-border/70 dark:bg-background/35'>
                  当前筛选条件下没有匹配的节点，试试清空搜索词或切换筛选条件。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
