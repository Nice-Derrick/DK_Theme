import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { CreditCard, ReceiptText, WalletCards } from 'lucide-react'
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
import {
  cancelOrder,
  checkoutOrder,
  getOrderDetail,
  getOrders,
  getPaymentMethods,
} from '@/lib/api/services/orders'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { Order, OrderDetail, PaymentMethod } from '@/lib/api/types'

const periodLabelMap: Record<string, string> = {
  month_price: '月付',
  quarter_price: '季付',
  half_year_price: '半年付',
  year_price: '年付',
  two_year_price: '两年付',
  three_year_price: '三年付',
  onetime_price: '一次性',
  reset_price: '重置流量包',
}

const statusMap: Record<number, { label: string; variant: 'warning' | 'secondary' | 'destructive' | 'success'; summary: string }> = {
  0: { label: '待支付', variant: 'warning', summary: '订单已生成，等待完成支付' },
  1: { label: '开通中', variant: 'secondary', summary: '订单已支付，系统正在处理开通' },
  2: { label: '已取消', variant: 'destructive', summary: '订单已取消，不可继续支付' },
  3: { label: '已完成', variant: 'success', summary: '订单已完成并已开通' },
  4: { label: '已折抵', variant: 'success', summary: '订单已被折抵处理' },
}

function getPeriodLabel(period?: string) {
  if (!period) return '--'
  return periodLabelMap[period] ?? period
}

function getStatusMeta(status: number) {
  return statusMap[status] ?? statusMap[0]
}

function getPlanPeriodPrice(detail: OrderDetail) {
  const plan = detail.plan as unknown as Record<string, number | null | undefined>
  return plan[detail.period] ?? detail.total_amount
}

function sortOrders(orders: Order[]) {
  return [...orders].sort((a, b) => b.created_at - a.created_at)
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

function getPaymentFallbackMeta(name: string) {
  if (name.includes('支付宝')) {
    return { label: '支', className: 'bg-[#1677ff] text-white' }
  }
  if (name.includes('微信')) {
    return { label: '微', className: 'bg-[#07c160] text-white' }
  }
  if (name.includes('余额')) {
    return { label: '¥', className: 'bg-amber-500 text-white' }
  }
  return { label: name.slice(0, 1) || '?', className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100' }
}

function getPaymentIconClass(name: string) {
  if (name.includes('支付宝')) {
    return 'h-7 w-7'
  }
  if (name.includes('微信')) {
    return 'h-[1.875rem] w-10'
  }
  if (name.includes('余额')) {
    return 'h-7 w-7'
  }
  return 'h-[1.875rem] w-[1.875rem]'
}

function PaymentMethodIcon({ method }: { method: PaymentMethod }) {
  const [broken, setBroken] = useState(false)
  const fallback = getPaymentFallbackMeta(method.name)
  const iconClassName = getPaymentIconClass(method.name)

  return (
    <div className='flex h-10 w-11 shrink-0 items-center justify-center overflow-hidden'>
      {!broken ? (
        <img
          src={method.icon}
          alt={method.name}
          className={`${iconClassName} object-contain`}
          onError={() => setBroken(true)}
        />
      ) : (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${fallback.className}`}>
          {fallback.label}
        </div>
      )}
    </div>
  )
}

type OrderFilter = 'all' | 'pending' | 'completed' | 'cancelled'

export function OrdersPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightedTradeNo = searchParams.get('trade_no')
  const [selectedTradeNo, setSelectedTradeNo] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)

  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const paymentMethodsQuery = useQuery({ queryKey: ['order-payment-methods'], queryFn: getPaymentMethods })
  const orders = useMemo(() => sortOrders(ordersQuery.data ?? []), [ordersQuery.data])
  const filteredOrders = useMemo(() => orders.filter((order) => {
    switch (orderFilter) {
      case 'pending':
        return order.status === 0
      case 'completed':
        return order.status === 3
      case 'cancelled':
        return order.status === 2
      default:
        return true
    }
  }), [orderFilter, orders])

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedTradeNo(null)
      return
    }

    setSelectedTradeNo((current) => {
      if (highlightedTradeNo && filteredOrders.some((item) => item.trade_no === highlightedTradeNo)) {
        return highlightedTradeNo
      }
      if (current && filteredOrders.some((item) => item.trade_no === current)) return current
      return filteredOrders[0].trade_no
    })
  }, [filteredOrders, highlightedTradeNo])

  useEffect(() => {
    if (!highlightedTradeNo || selectedTradeNo !== highlightedTradeNo) return
    const next = new URLSearchParams(searchParams)
    next.delete('trade_no')
    setSearchParams(next, { replace: true })
  }, [highlightedTradeNo, searchParams, selectedTradeNo, setSearchParams])

  useEffect(() => {
    if (!paymentMethodsQuery.data?.length) return
    setSelectedPaymentMethodId((current) => current ?? paymentMethodsQuery.data?.[0]?.id ?? null)
  }, [paymentMethodsQuery.data])

  const detailQuery = useQuery({
    queryKey: ['order-detail', selectedTradeNo],
    queryFn: () => getOrderDetail(selectedTradeNo as string),
    enabled: selectedTradeNo != null,
    refetchInterval: (query) => {
      const detail = query.state.data as OrderDetail | undefined
      if (!detail) return false
      return detail.status === 0 || detail.status === 1 ? 10000 : false
    },
    refetchIntervalInBackground: true,
  })

  const cancelOrderMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<Order[]>(['orders'], (current) => sortOrders((current ?? []).map((item) => (
        item.trade_no === variables.trade_no ? { ...item, status: 2 } : item
      ))))
      queryClient.setQueryData<OrderDetail | undefined>(['order-detail', variables.trade_no], (current) => current ? { ...current, status: 2 } : current)
      toast.success('订单已取消')
      setCancelDialogOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'inactive' })
      void queryClient.invalidateQueries({ queryKey: ['order-detail', variables.trade_no], refetchType: 'inactive' })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '取消订单失败，请稍后重试'))
    },
  })

  const checkoutOrderMutation = useMutation({
    mutationFn: checkoutOrder,
    onSuccess: (checkoutUrl, variables) => {
      toast.success('正在跳转支付')
      setPaymentDialogOpen(false)
      queryClient.setQueryData<Order[]>(['orders'], (current) => sortOrders((current ?? []).map((item) => (
        item.trade_no === variables.trade_no ? { ...item, status: 1 } : item
      ))))
      queryClient.setQueryData<OrderDetail | undefined>(['order-detail', variables.trade_no], (current) => current ? { ...current, status: 1 } : current)
      void queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'inactive' })
      void queryClient.invalidateQueries({ queryKey: ['order-detail', variables.trade_no], refetchType: 'inactive' })
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '发起支付失败，请稍后重试'))
    },
  })

  const pendingCount = orders.filter((item) => item.status === 0).length
  const completedCount = orders.filter((item) => item.status === 3).length
  const cancelledCount = orders.filter((item) => item.status === 2).length
  const totalAmount = orders.reduce((sum, item) => sum + item.total_amount, 0)
  const detail = detailQuery.data

  function handleCancelOrder() {
    if (!selectedTradeNo) {
      toast.error('请先选择订单')
      return
    }
    cancelOrderMutation.mutate({ trade_no: selectedTradeNo })
  }

  function handleCheckoutOrder() {
    if (!selectedTradeNo) {
      toast.error('请先选择订单')
      return
    }
    if (!selectedPaymentMethodId) {
      toast.error('请选择支付方式')
      return
    }
    checkoutOrderMutation.mutate({ trade_no: selectedTradeNo, method: selectedPaymentMethodId })
  }

  return (
    <div className='space-y-8'>
      <PageHeader
        badge='订单中心'
        title='订单中心'
        actions={<Badge variant='outline' className='rounded-full border-slate-200/80 bg-white/80 dark:border-border/70 dark:bg-background/35'>订单状态</Badge>}
      />

      <div className='px-4 lg:px-6'>
        <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
          <CardContent className='grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><ReceiptText className='size-4' />订单总数</div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{orders.length}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><WalletCards className='size-4' />待支付</div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{pendingCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><CreditCard className='size-4' />已完成</div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{completedCount}</div>
            </div>
            <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'><ReceiptText className='size-4' />累计金额</div>
              <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{formatCurrency(totalAmount)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='px-4 lg:px-6'>
        <div className='grid gap-6 xl:grid-cols-[0.95fr_1.05fr]'>
          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader className='space-y-4'>
              <div>
                <CardTitle>订单列表</CardTitle>
                <CardDescription>查看订单状态与金额。</CardDescription>
              </div>
              <div className='flex flex-wrap gap-2'>
                {[
                  { key: 'all' as const, label: `全部 ${orders.length}` },
                  { key: 'pending' as const, label: `待支付 ${pendingCount}` },
                  { key: 'completed' as const, label: `已完成 ${completedCount}` },
                  { key: 'cancelled' as const, label: `已取消 ${cancelledCount}` },
                ].map((item) => (
                  <Button
                    key={item.key}
                    variant={orderFilter === item.key ? 'default' : 'outline'}
                    className={orderFilter === item.key ? 'rounded-2xl' : 'rounded-2xl bg-white/90 dark:bg-transparent'}
                    onClick={() => setOrderFilter(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {ordersQuery.isError ? (
                <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                  <div className='text-base font-medium text-rose-700 dark:text-rose-300'>订单列表加载失败</div>
                  <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>请检查订单接口是否可用，或稍后重新加载。</div>
                  <div className='mt-4'>
                    <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => ordersQuery.refetch()}>
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : ordersQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                    <div className='h-5 w-40 rounded-full bg-slate-200/80 dark:bg-white/10' />
                    <div className='mt-3 h-4 w-32 rounded-full bg-slate-200/60 dark:bg-white/5' />
                  </div>
                ))
              ) : filteredOrders.map((order) => {
                const status = getStatusMeta(order.status)
                const active = order.trade_no === selectedTradeNo
                const highlighted = order.trade_no === highlightedTradeNo
                return (
                  <button
                    key={order.trade_no}
                    type='button'
                    onClick={() => setSelectedTradeNo(order.trade_no)}
                    className={active
                      ? `w-full rounded-3xl border p-5 text-left shadow-sm transition ${highlighted ? 'border-sky-400 bg-sky-50/70 dark:border-sky-400/50 dark:bg-sky-500/10' : 'border-primary/35 bg-primary/5 dark:bg-primary/10'}`
                      : `w-full rounded-3xl border p-5 text-left transition hover:border-primary/30 hover:bg-white dark:border-border/70 dark:bg-background/35 dark:hover:bg-background/50 ${highlighted ? 'border-sky-300 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/5' : 'border-slate-200/80 bg-slate-50/85'}`}
                  >
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                      <div className='min-w-0 space-y-2'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <div className='break-all font-semibold text-slate-900 dark:text-foreground'>{order.trade_no}</div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className='break-words text-sm text-slate-900 dark:text-foreground'>{order.plan.name} · {getPeriodLabel(order.period)}</div>
                        <div className='text-sm text-slate-500 dark:text-muted-foreground'>创建时间：{formatDateTime(order.created_at)}</div>
                      </div>
                      <div className='text-lg font-semibold text-slate-900 dark:text-foreground'>{formatCurrency(order.total_amount)}</div>
                    </div>
                  </button>
                )
              })}
              {!ordersQuery.isLoading && orders.length === 0 ? (
                <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>暂无订单记录。</div>
              ) : null}
              {!ordersQuery.isLoading && orders.length > 0 && filteredOrders.length === 0 ? (
                <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>当前筛选条件下没有匹配的订单。</div>
              ) : null}
            </CardContent>
          </Card>

          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader>
              <CardTitle>订单详情</CardTitle>
              <CardDescription>查看订单信息与当前操作。</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {detailQuery.isError ? (
                <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                  <div className='text-base font-medium text-rose-700 dark:text-rose-300'>订单详情加载失败</div>
                  <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>请检查详情接口返回结构，或点击按钮重新加载。</div>
                  <div className='mt-4'>
                    <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => detailQuery.refetch()}>
                      重新加载详情
                    </Button>
                  </div>
                </div>
              ) : detailQuery.isLoading ? (
                <div className='space-y-3'>
                  <div className='h-6 w-48 rounded-full bg-slate-200/80 dark:bg-white/10' />
                  <div className='h-24 rounded-3xl bg-slate-100/80 dark:bg-white/5' />
                </div>
              ) : detail ? (
                <>
                  <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant={getStatusMeta(detail.status).variant}>{getStatusMeta(detail.status).label}</Badge>
                      <Badge variant='outline' className='bg-white/90 dark:bg-transparent'>{getPeriodLabel(detail.period)}</Badge>
                      {(detail.status === 0 || detail.status === 1) ? (
                        <Badge variant='outline' className='border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300'>
                          每 10 秒自动轮询状态
                        </Badge>
                      ) : null}
                    </div>
                    <div className='mt-3 break-words text-xl font-semibold text-slate-900 dark:text-foreground'>{detail.plan.name}</div>
                    <div className='mt-2 break-all text-sm text-slate-500 dark:text-muted-foreground'>订单号：{detail.trade_no}</div>
                    <div className='mt-2 text-sm text-slate-500 dark:text-muted-foreground'>创建时间：{formatDateTime(detail.created_at)}</div>
                    {(detail.status === 0 || detail.status === 1) ? (
                      <div className='mt-3 rounded-2xl border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'>
                        当前订单状态更新中。
                      </div>
                    ) : null}
                  </div>

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                      <div className='text-sm text-slate-500 dark:text-muted-foreground'>商品流量</div>
                      <div className='mt-2 text-lg font-semibold text-slate-900 dark:text-foreground'>{detail.plan.transfer_enable} GB</div>
                    </div>
                    <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                      <div className='text-sm text-slate-500 dark:text-muted-foreground'>订单状态说明</div>
                      <div className='mt-2 text-sm text-slate-900 dark:text-foreground'>{getStatusMeta(detail.status).summary}</div>
                    </div>
                  </div>

                  <div className='space-y-3 rounded-3xl border border-slate-200/80 bg-white/90 p-5 dark:border-border/70 dark:bg-background/20'>
                    <div className='text-base font-medium text-slate-900 dark:text-foreground'>订单摘要</div>
                    <div className='flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground'><span>商品价格</span><span>{formatCurrency(getPlanPeriodPrice(detail))}</span></div>
                    <div className='flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground'><span>余额支付</span><span>{formatCurrency(detail.balance_amount)}</span></div>
                    <div className='flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground'><span>抵扣金额</span><span>{formatCurrency(detail.discount_amount)}</span></div>
                    <div className='flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground'><span>支付手续费</span><span>{formatCurrency(detail.handling_amount)}</span></div>
                    <div className='h-px bg-slate-200/80 dark:bg-border' />
                    <div className='flex flex-col gap-1 text-base font-semibold text-slate-900 sm:flex-row sm:items-center sm:justify-between dark:text-foreground'><span>总计</span><span>{formatCurrency(detail.total_amount)}</span></div>
                  </div>

                  <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap'>
                    {detail.status === 0 ? (
                      <>
                        <Button className='w-full sm:w-auto' onClick={() => setPaymentDialogOpen(true)} disabled={checkoutOrderMutation.isPending}>继续支付</Button>
                        <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setCancelDialogOpen(true)} disabled={cancelOrderMutation.isPending}>取消订单</Button>
                      </>
                    ) : null}
                    <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => detailQuery.refetch()} disabled={detailQuery.isFetching}>刷新详情</Button>
                  </div>
                </>
              ) : (
                <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>请选择一条订单查看详情。</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>选择支付方式</DialogTitle>
            <DialogDescription>请选择支付方式</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {paymentMethodsQuery.isError ? (
              <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'>
                支付方式加载失败，请稍后重试。
              </div>
            ) : paymentMethodsQuery.data?.length ? paymentMethodsQuery.data.map((method: PaymentMethod) => {
              const active = method.id === selectedPaymentMethodId
              return (
                <button
                  key={method.id}
                  type='button'
                  onClick={() => setSelectedPaymentMethodId(method.id)}
                  className={active
                    ? 'flex w-full items-center gap-4 rounded-3xl border border-primary/35 bg-primary/5 p-4 text-left dark:bg-primary/10'
                    : 'flex w-full items-center gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4 text-left dark:border-border/70 dark:bg-background/35'}
                >
                  <PaymentMethodIcon method={method} />
                  <div className='font-medium text-slate-900 dark:text-foreground'>{method.name}</div>
                </button>
              )
            }) : (
              <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>
                当前没有可用的支付方式。
              </div>
            )}
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='w-full sm:w-auto' onClick={handleCheckoutOrder} disabled={checkoutOrderMutation.isPending}>{checkoutOrderMutation.isPending ? '跳转中...' : '确认支付'}</Button>
              <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setPaymentDialogOpen(false)}>取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>确认取消订单？</DialogTitle>
            <DialogDescription>取消后该订单将不可继续支付，请确认是否继续。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='break-all rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
              当前订单：{detail ? `${detail.trade_no} · ${detail.plan.name}` : '--'}
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='w-full sm:w-auto' variant='destructive' onClick={handleCancelOrder} disabled={cancelOrderMutation.isPending}>{cancelOrderMutation.isPending ? '取消中...' : '确认取消'}</Button>
              <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setCancelDialogOpen(false)}>返回</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
