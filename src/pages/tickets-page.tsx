import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, MessageSquareText, Plus, Search, ShieldAlert, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  closeTicket,
  createTicket,
  getTicketDetail,
  getTickets,
  replyTicket,
} from '@/lib/api/services/tickets'
import { formatDateTime } from '@/lib/format'
import type { Ticket as TicketItem, TicketDetail } from '@/lib/api/types'

type TicketFilter = 'all' | 'open' | 'closed' | 'pending'
type TicketLevel = '0' | '1' | '2'

const levelOptions: Array<{ value: TicketLevel; label: string }> = [
  { value: '0', label: '低级' },
  { value: '1', label: '中级' },
  { value: '2', label: '高级' },
]

const levelMap: Record<number, { label: string; className: string }> = {
  0: { label: '低级', className: 'bg-white/90 text-slate-600 dark:bg-transparent dark:text-muted-foreground' },
  1: { label: '中级', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300' },
  2: { label: '高级', className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300' },
}

const ticketStatusMap: Record<number, { label: string; variant: 'success' | 'secondary'; summary: string }> = {
  0: { label: '已开启', variant: 'success', summary: '工单仍可继续跟进和回复' },
  1: { label: '已关闭', variant: 'secondary', summary: '工单流程已结束，无法继续回复' },
}

const replyStatusMap: Record<number, { label: string; variant: 'success' | 'warning'; summary: string }> = {
  0: { label: '已回复', variant: 'success', summary: '最近一条消息已得到处理或答复' },
  1: { label: '待回复', variant: 'warning', summary: '当前仍在等待客服继续处理' },
}

function sortTicketsByUpdatedAt(tickets: TicketItem[]) {
  return [...tickets].sort((a, b) => b.updated_at - a.updated_at)
}

function getTicketStatus(ticket: TicketItem | TicketDetail) {
  return ticketStatusMap[ticket.status] ?? ticketStatusMap[0]
}

function getReplyStatus(ticket: TicketItem | TicketDetail) {
  if (ticket.status === 1) {
    return ticketStatusMap[1]
  }
  return replyStatusMap[ticket.reply_status] ?? replyStatusMap[1]
}

function updateTicketInList(tickets: TicketItem[] | undefined, ticketId: number, updater: (ticket: TicketItem) => TicketItem) {
  if (!tickets) return tickets
  return sortTicketsByUpdatedAt(tickets.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket)))
}

function appendReplyToDetail(detail: TicketDetail | undefined, message: string, createdAt: number) {
  if (!detail) return detail

  return {
    ...detail,
    reply_status: 0,
    updated_at: createdAt,
    message: [
      ...detail.message,
      {
        message,
        created_at: createdAt,
        is_me: true,
      },
    ],
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = 'response' in error ? (error as { response?: { data?: { message?: unknown } } }).response : undefined
    const message = maybeResponse?.data?.message
    if (typeof message === 'string' && message.trim()) return message

    const directMessage = 'message' in error ? (error as { message?: unknown }).message : undefined
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
  }

  return fallback
}

export function TicketsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<TicketFilter>('all')
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newLevel, setNewLevel] = useState<TicketLevel>('0')
  const [newMessage, setNewMessage] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const ticketsQuery = useQuery({ queryKey: ['tickets'], queryFn: getTickets })
  const tickets = useMemo(() => sortTicketsByUpdatedAt(ticketsQuery.data ?? []), [ticketsQuery.data])

  useEffect(() => {
    if (!tickets.length) {
      setSelectedTicketId(null)
      return
    }

    setSelectedTicketId((current) => {
      if (current && tickets.some((ticket) => ticket.id === current)) return current
      return tickets[0].id
    })
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return tickets.filter((ticket) => {
      const matchesKeyword = search
        ? `${ticket.id} ${ticket.subject}`.toLowerCase().includes(search)
        : true

      const matchesFilter = (() => {
        switch (filter) {
          case 'open':
            return ticket.status === 0
          case 'closed':
            return ticket.status === 1
          case 'pending':
            return ticket.status === 0 && ticket.reply_status === 1
          default:
            return true
        }
      })()

      return matchesKeyword && matchesFilter
    })
  }, [filter, keyword, tickets])

  const detailQuery = useQuery({
    queryKey: ['ticket-detail', selectedTicketId],
    queryFn: () => getTicketDetail(selectedTicketId as number),
    enabled: selectedTicketId != null,
  })

  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: async () => {
      toast.success('工单已提交')
      setCreateOpen(false)
      setNewSubject('')
      setNewLevel('0')
      setNewMessage('')
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '提交工单失败，请稍后重试'))
    },
  })

  const replyTicketMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) => replyTicket(id, message),
    onSuccess: (_data, variables) => {
      const now = Math.floor(Date.now() / 1000)

      queryClient.setQueryData<TicketItem[]>(['tickets'], (current) => updateTicketInList(current, variables.id, (ticket) => ({
        ...ticket,
        reply_status: 0,
        updated_at: now,
      })))

      queryClient.setQueryData<TicketDetail | undefined>(['ticket-detail', variables.id], (current) => appendReplyToDetail(current, variables.message, now))

      void queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'inactive' })
      void queryClient.invalidateQueries({ queryKey: ['ticket-detail', variables.id], refetchType: 'inactive' })

      toast.success('工单回复已提交')
      setReplyMessage('')
      replyTextareaRef.current?.focus()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '回复失败，请稍后重试'))
    },
  })

  const closeTicketMutation = useMutation({
    mutationFn: closeTicket,
    onSuccess: (_data, ticketId) => {
      const now = Math.floor(Date.now() / 1000)

      queryClient.setQueryData<TicketItem[]>(['tickets'], (current) => updateTicketInList(current, ticketId, (ticket) => ({
        ...ticket,
        status: 1,
        updated_at: now,
      })))

      queryClient.setQueryData<TicketDetail | undefined>(['ticket-detail', ticketId], (current) => {
        if (!current) return current
        return {
          ...current,
          status: 1,
          updated_at: now,
        }
      })

      void queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'inactive' })
      void queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId], refetchType: 'inactive' })

      toast.success('工单已关闭')
      setCloseConfirmOpen(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '关闭工单失败，请稍后重试'))
    },
  })

  const detail = detailQuery.data

  useEffect(() => {
    if (!detail?.message?.length) return
    const container = messageListRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [detail?.id, detail?.message?.length])

  const totalCount = tickets.length
  const openCount = tickets.filter((ticket) => ticket.status === 0).length
  const closedCount = tickets.filter((ticket) => ticket.status === 1).length
  const pendingCount = tickets.filter((ticket) => ticket.status === 0 && ticket.reply_status === 1).length
  const highLevelCount = tickets.filter((ticket) => ticket.level === 2).length
  const lastUpdatedAt = tickets[0]?.updated_at

  function handleCreateTicket() {
    if (!newSubject.trim()) {
      toast.error('请输入工单主题')
      return
    }

    if (!newMessage.trim()) {
      toast.error('请输入工单内容')
      return
    }

    createTicketMutation.mutate({
      subject: newSubject.trim(),
      level: newLevel,
      message: newMessage.trim(),
    })
  }

  function handleReplyTicket() {
    if (!selectedTicketId) {
      toast.error('请先选择工单')
      return
    }

    if (!replyMessage.trim()) {
      toast.error('请输入回复内容')
      return
    }

    replyTicketMutation.mutate({ id: selectedTicketId, message: replyMessage.trim() })
  }

  function handleCloseTicket() {
    if (!selectedTicketId) {
      toast.error('请先选择工单')
      return
    }

    closeTicketMutation.mutate(selectedTicketId)
  }

  function handleReplyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      handleReplyTicket()
    }
  }

  return (
    <div className='space-y-8'>
      <PageHeader
        badge='工单支持'
        title='工单支持'
        actions={
          <Button className='rounded-2xl' onClick={() => setCreateOpen(true)}>
            <Plus className='size-4' />
            新建工单
          </Button>
        }
      />

      <div className='px-4 lg:px-6'>
        <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
          <CardContent className='grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5'>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                <Ticket className='size-4' />
                工单总数
              </div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{totalCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                <Clock3 className='size-4' />
                已开启
              </div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{openCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                <MessageSquareText className='size-4' />
                待回复
              </div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{pendingCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                <ShieldAlert className='size-4' />
                高级工单
              </div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{highLevelCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                <Clock3 className='size-4' />
                最近更新
              </div>
              <div className='mt-3 text-base font-semibold text-slate-900 dark:text-foreground'>{lastUpdatedAt ? formatDateTime(lastUpdatedAt) : '--'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='px-4 lg:px-6'>
        <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader className='space-y-4'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <CardTitle>工单列表</CardTitle>
                  <CardDescription>查看并筛选当前工单。</CardDescription>
                </div>
                <div className='relative w-full max-w-sm min-w-0'>
                  <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder='搜索工单编号或主题'
                    className='bg-white/90 pl-9 dark:bg-input/30'
                  />
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {[
                  { value: 'all' as const, label: `全部 ${totalCount}` },
                  { value: 'open' as const, label: `已开启 ${openCount}` },
                  { value: 'pending' as const, label: `待回复 ${pendingCount}` },
                  { value: 'closed' as const, label: `已关闭 ${closedCount}` },
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant={filter === item.value ? 'default' : 'outline'}
                    className={filter === item.value ? 'rounded-2xl' : 'rounded-2xl bg-white/90 dark:bg-transparent'}
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {ticketsQuery.isError ? (
                <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                  <div className='text-base font-medium text-rose-700 dark:text-rose-300'>工单列表加载失败</div>
                  <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>请检查接口连通性或稍后重试。</div>
                  <div className='mt-4'>
                    <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => ticketsQuery.refetch()}>
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : ticketsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                    <div className='h-5 w-40 rounded-full bg-slate-200/80 dark:bg-white/10' />
                    <div className='mt-3 h-4 w-32 rounded-full bg-slate-200/60 dark:bg-white/5' />
                  </div>
                ))
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => {
                  const ticketStatus = getTicketStatus(ticket)
                  const replyStatus = getReplyStatus(ticket)
                  const level = levelMap[ticket.level] ?? levelMap[0]
                  const active = selectedTicketId === ticket.id

                  return (
                    <button
                      key={ticket.id}
                      type='button'
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={active
                        ? 'w-full rounded-3xl border border-primary/35 bg-primary/5 p-5 text-left shadow-sm transition dark:bg-primary/10'
                        : 'w-full rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 text-left transition hover:border-primary/30 hover:bg-white dark:border-border/70 dark:bg-background/35 dark:hover:bg-background/50'}
                    >
                      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                        <div className='min-w-0 space-y-2'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <div className='text-base font-semibold text-slate-900 dark:text-foreground'>#{ticket.id}</div>
                            <Badge variant={ticketStatus.variant}>{ticketStatus.label}</Badge>
                            <Badge variant={replyStatus.variant}>{replyStatus.label}</Badge>
                            <Badge variant='outline' className={level.className}>{level.label}</Badge>
                          </div>
                          <div className='break-words text-base text-slate-900 dark:text-foreground'>{ticket.subject}</div>
                          <div className='flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 dark:text-muted-foreground'>
                            <span>创建于 {formatDateTime(ticket.created_at)}</span>
                            <span className='hidden sm:inline'>·</span>
                            <span>最后回复 {formatDateTime(ticket.updated_at)}</span>
                          </div>
                        </div>
                        <div className='text-sm text-slate-500 md:max-w-56 md:text-right dark:text-muted-foreground'>
                          {replyStatus.summary}
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center dark:border-border/70 dark:bg-background/20'>
                  <div className='text-base font-medium text-slate-900 dark:text-foreground'>没有匹配的工单</div>
                  <div className='mt-2 text-sm text-slate-500 dark:text-muted-foreground'>当前没有匹配的工单。</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <CardTitle>工单详情</CardTitle>
                  <CardDescription>查看会话记录并处理当前工单。</CardDescription>
                </div>
                {detail ? (
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant={getTicketStatus(detail).variant}>{getTicketStatus(detail).label}</Badge>
                    <Badge variant={getReplyStatus(detail).variant}>{getReplyStatus(detail).label}</Badge>
                    <Badge variant='outline' className={(levelMap[detail.level] ?? levelMap[0]).className}>{(levelMap[detail.level] ?? levelMap[0]).label}</Badge>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {detailQuery.isError ? (
                <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                  <div className='text-base font-medium text-rose-700 dark:text-rose-300'>工单详情加载失败</div>
                  <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>请检查详情接口返回结构，或点击下方按钮重试。</div>
                  <div className='mt-4 flex flex-wrap gap-3'>
                    <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => detailQuery.refetch()}>
                      重新加载详情
                    </Button>
                  </div>
                </div>
              ) : detailQuery.isLoading ? (
                <div className='space-y-3'>
                  <div className='h-6 w-48 rounded-full bg-slate-200/80 dark:bg-white/10' />
                  <div className='h-24 rounded-3xl bg-slate-100/80 dark:bg-white/5' />
                  <div className='h-24 rounded-3xl bg-slate-100/70 dark:bg-white/5' />
                </div>
              ) : detail ? (
                <>
                  <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                    <div className='text-sm text-slate-500 dark:text-muted-foreground'>工单主题</div>
                    <div className='mt-2 break-words text-xl font-semibold text-slate-900 dark:text-foreground'>#{detail.id} · {detail.subject}</div>
                    <div className='mt-3 grid gap-3 text-sm text-slate-500 dark:text-muted-foreground sm:grid-cols-2'>
                      <div>创建时间：{formatDateTime(detail.created_at)}</div>
                      <div>最后回复：{formatDateTime(detail.updated_at)}</div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <div className='text-sm font-medium text-slate-900 dark:text-foreground'>会话记录</div>
                      <div className='text-xs text-slate-500 dark:text-muted-foreground'>会话记录</div>
                    </div>
                    <div ref={messageListRef} className='max-h-[28rem] space-y-3 overflow-y-auto pr-1'>
                      {detail.message.length > 0 ? detail.message.map((item, index) => (
                        <div
                          key={`${item.created_at}-${index}`}
                          className={item.is_me
                            ? 'ml-auto max-w-[88%] rounded-3xl border border-primary/20 bg-primary/8 p-4 dark:bg-primary/10'
                            : 'mr-auto max-w-[88%] rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-border/70 dark:bg-background/35'}
                        >
                          <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
                            <div className='text-sm font-medium text-slate-900 dark:text-foreground'>
                              {item.is_me ? '你' : '管理员'}
                            </div>
                            <div className='text-xs text-slate-500 dark:text-muted-foreground'>{formatDateTime(item.created_at)}</div>
                          </div>
                          <div className='mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-muted-foreground'>{item.message}</div>
                        </div>
                      )) : (
                        <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>
                          当前工单暂无会话记录。
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='space-y-3 rounded-3xl border border-slate-200/80 bg-white/90 p-5 dark:border-border/70 dark:bg-background/20'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                      <div>
                        <div className='text-sm font-medium text-slate-900 dark:text-foreground'>继续回复</div>
                        <div className='mt-1 text-sm text-slate-500 dark:text-muted-foreground'>回复当前工单</div>
                      </div>
                      {detail.status === 0 ? (
                        <Button
                          variant='outline'
                          className='w-full rounded-2xl bg-white/90 sm:w-auto dark:bg-transparent'
                          onClick={() => setCloseConfirmOpen(true)}
                          disabled={closeTicketMutation.isPending}
                        >
                          {closeTicketMutation.isPending ? '关闭中...' : '关闭工单'}
                        </Button>
                      ) : null}
                    </div>
                    <textarea
                      ref={replyTextareaRef}
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      onKeyDown={handleReplyKeyDown}
                      placeholder={detail.status === 0 ? '请输入要发送给管理员的回复内容，支持 Ctrl/⌘ + Enter 快速发送' : '工单已关闭，无法继续回复'}
                      disabled={detail.status !== 0 || replyTicketMutation.isPending}
                      rows={5}
                      className='min-h-32 w-full rounded-3xl border border-slate-200/80 bg-slate-50/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border/70 dark:bg-background/35 dark:text-foreground'
                    />
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div className='text-xs text-slate-500 dark:text-muted-foreground'>Ctrl/⌘ + Enter 发送</div>
                      <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
                        <Button className='w-full sm:w-auto' onClick={handleReplyTicket} disabled={detail.status !== 0 || replyTicketMutation.isPending}>
                          {replyTicketMutation.isPending ? '发送中...' : '发送回复'}
                        </Button>
                        <Button
                          variant='outline'
                          className='w-full bg-white/90 sm:w-auto dark:bg-transparent'
                          onClick={() => detailQuery.refetch()}
                          disabled={detailQuery.isFetching}
                        >
                          刷新详情
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center dark:border-border/70 dark:bg-background/20'>
                  <div className='text-base font-medium text-slate-900 dark:text-foreground'>请选择一条工单</div>
                  <div className='mt-2 text-sm text-slate-500 dark:text-muted-foreground'>请选择一条工单查看详情。</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>新建工单</DialogTitle>
            <DialogDescription>填写工单信息后提交。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='text-sm font-medium text-slate-900 dark:text-foreground'>工单主题</div>
              <Input
                value={newSubject}
                onChange={(event) => setNewSubject(event.target.value)}
                placeholder='请输入工单主题'
                className='bg-white/90 dark:bg-input/30'
              />
            </div>
            <div className='space-y-2'>
              <div className='text-sm font-medium text-slate-900 dark:text-foreground'>工单等级</div>
              <Select value={newLevel} onValueChange={(value) => setNewLevel(value as TicketLevel)}>
                <SelectTrigger className='bg-white/90 dark:bg-input/30'>
                  <SelectValue placeholder='请选择工单等级' />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <div className='text-sm font-medium text-slate-900 dark:text-foreground'>工单内容</div>
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                rows={6}
                placeholder='请描述你遇到的问题'
                className='min-h-36 w-full rounded-3xl border border-slate-200/80 bg-slate-50/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 dark:border-border/70 dark:bg-background/35 dark:text-foreground'
              />
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='w-full sm:w-auto' onClick={handleCreateTicket} disabled={createTicketMutation.isPending}>{createTicketMutation.isPending ? '提交中...' : '提交工单'}</Button>
              <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setCreateOpen(false)}>取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>确认关闭工单</DialogTitle>
            <DialogDescription>关闭后该工单将进入已关闭状态，通常无法继续回复。请确认是否继续。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='break-words rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
              当前工单：{detail ? `#${detail.id} · ${detail.subject}` : '未选择工单'}
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='w-full sm:w-auto' variant='destructive' onClick={handleCloseTicket} disabled={closeTicketMutation.isPending}>
                {closeTicketMutation.isPending ? '关闭中...' : '确认关闭'}
              </Button>
              <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setCloseConfirmOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
