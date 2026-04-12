import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconArrowRight, IconCheck, IconCreditCard, IconSparkles } from '@tabler/icons-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import type { Plan } from '@/lib/api/types'
import { createOrder, getOrders } from '@/lib/api/services/orders'
import { getPlans } from '@/lib/api/services/user'
import { formatBytes, formatCurrency, formatDateTime } from '@/lib/format'

type RecurringPeriodKey = 'month_price' | 'quarter_price' | 'half_year_price' | 'year_price' | 'two_year_price' | 'three_year_price'
type OneTimePeriodKey = 'onetime_price' | 'reset_price'
type PeriodKey = RecurringPeriodKey | OneTimePeriodKey

const recurringPeriodOptions: Array<{
  key: RecurringPeriodKey
  label: string
  shortLabel: string
  cycleSuffix: string
  badge?: string
}> = [
  { key: 'month_price', label: '月付', shortLabel: '月付', cycleSuffix: '/ 月' },
  { key: 'quarter_price', label: '季付', shortLabel: '季付', cycleSuffix: '/ 季' },
  { key: 'half_year_price', label: '半年付', shortLabel: '半年付', cycleSuffix: '/ 半年' },
  { key: 'year_price', label: '年付', shortLabel: '年付', cycleSuffix: '/ 年', badge: '推荐' },
  { key: 'two_year_price', label: '两年付', shortLabel: '两年付', cycleSuffix: '/ 2 年' },
  { key: 'three_year_price', label: '三年付', shortLabel: '三年付', cycleSuffix: '/ 3 年' },
]

const oneTimePeriodOptions: Array<{
  key: OneTimePeriodKey
  label: string
  summaryLabel: string
}> = [
  { key: 'onetime_price', label: '一次性购买', summaryLabel: '一次性' },
  { key: 'reset_price', label: '流量重置', summaryLabel: '重置流量包' },
]

function formatPlanTraffic(transfer?: number | null) {
  if (transfer == null) return '--'
  if (transfer > 0 && transfer < 1024 * 1024) return `${transfer} GB`
  return formatBytes(transfer)
}

function getPlanHighlights(name: string, transfer?: number | null, mode: 'recurring' | 'oneTime' = 'recurring') {
  const traffic = formatPlanTraffic(transfer)

  if (mode === 'oneTime') {
    return [`补充流量 ${traffic}`, '适合临时加量与短期使用', '购买后按一次性资源发放']
  }

  if (/starter|入门/i.test(name)) {
    return [`总流量 ${traffic}`, '适合轻量日常使用', '支持多设备连接']
  }

  if (/max|unlimited|旗舰/i.test(name)) {
    return [`总流量 ${traffic}`, '更适合高频流媒体与下载', '适合重度用户']
  }

  return [`总流量 ${traffic}`, '适合办公与流媒体', '更均衡的长期选择']
}

function getPlanPrice(plan: Plan, period: PeriodKey) {
  return plan[period]
}

function hasPrice(value?: number | null) {
  return value != null
}

function getRecurringPeriods(plan: Plan) {
  return recurringPeriodOptions.filter((option) => hasPrice(plan[option.key]))
}

function getOneTimePeriods(plan: Plan) {
  return oneTimePeriodOptions.filter((option) => hasPrice(plan[option.key]))
}

function getRecurringPeriodOption(period: RecurringPeriodKey) {
  return recurringPeriodOptions.find((option) => option.key === period) ?? recurringPeriodOptions[0]
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = 'response' in error ? (error as { response?: { data?: { message?: unknown } } }).response : undefined
    const message = maybeResponse?.data?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

function getYearSaving(plan: Plan) {
  if (!plan.month_price || !plan.year_price) return null
  const saving = plan.month_price * 12 - plan.year_price
  return saving > 0 ? saving : null
}

export function PlansPage() {
  const { user, subscribe } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: getPlans })
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const [selectedRecurringPeriod, setSelectedRecurringPeriod] = useState<RecurringPeriodKey>('year_price')

  const plans = plansQuery.data ?? []
  const pendingOrders = (ordersQuery.data ?? []).filter((order) => order.status === 0)
  const processingOrders = (ordersQuery.data ?? []).filter((order) => order.status === 1)
  const latestPendingOrder = pendingOrders[0]
  const latestProcessingOrder = processingOrders[0]
  const currentPlanName = subscribe?.plan ?? user?.plan ?? '未选择套餐'
  const currentExpireAt = subscribe?.expired_at ?? user?.expired_at
  const recurringPlans = useMemo(() => plans.filter((plan) => getRecurringPeriods(plan).length > 0), [plans])
  const oneTimePlans = useMemo(() => plans.filter((plan) => getRecurringPeriods(plan).length === 0 && getOneTimePeriods(plan).length > 0), [plans])
  const availableRecurringOptions = useMemo(
    () => recurringPeriodOptions.filter((option) => recurringPlans.some((plan) => hasPrice(plan[option.key]))),
    [recurringPlans],
  )
  const activeRecurringPeriod = availableRecurringOptions.some((option) => option.key === selectedRecurringPeriod)
    ? selectedRecurringPeriod
    : (availableRecurringOptions.find((option) => option.key === 'year_price')?.key ?? availableRecurringOptions[0]?.key ?? 'year_price')
  const recommendedPlanId = useMemo(() => recurringPlans[1]?.id ?? recurringPlans[0]?.id ?? plans[0]?.id ?? null, [plans, recurringPlans])
  const recommendedOneTimePlanId = useMemo(() => {
    const addOnPlans = oneTimePlans.filter((plan) => hasPrice(plan.onetime_price))
    if (!addOnPlans.length) return null
    return addOnPlans[Math.floor(addOnPlans.length / 2)]?.id ?? addOnPlans[0]?.id ?? null
  }, [oneTimePlans])

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (tradeNo) => {
      toast.success(`订单已创建：${tradeNo}`)
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/orders?trade_no=${encodeURIComponent(tradeNo)}`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '创建订单失败，请稍后重试'))
    },
  })

  function handlePurchase(plan: Plan, period: PeriodKey, unsupportedMessage = '当前套餐暂不支持该购买方式') {
    if (latestPendingOrder || latestProcessingOrder) {
      navigate('/orders')
      return
    }

    const displayPrice = getPlanPrice(plan, period)
    if (displayPrice == null) {
      toast.error(unsupportedMessage)
      return
    }

    createOrderMutation.mutate({
      plan_id: plan.id,
      period,
    })
  }

  return (
    <div className='space-y-10'>
      <PageHeader
        badge='订购套餐'
        title='订购套餐'
        actions={
          <Button variant='outline' className='rounded-full bg-white/90 dark:bg-transparent'>
            <IconCreditCard className='size-4' />
            管理当前套餐
          </Button>
        }
      />

      <div className='px-4 lg:px-6'>
        <div className='mx-auto max-w-4xl text-center'>
          <div className='space-y-3'>
            <h2 className='text-4xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>选择适合你的套餐</h2>
          </div>

          <div className='mt-4 inline-flex flex-col items-center justify-center gap-1 rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-500 shadow-sm sm:flex-row sm:flex-wrap sm:gap-2 sm:rounded-full sm:py-2 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
            <span className='break-all text-center sm:text-left'>当前套餐：{currentPlanName}</span>
            <span className='hidden sm:inline'>·</span>
            <span className='text-center sm:text-left'>到期时间：{formatDateTime(currentExpireAt)}</span>
          </div>

          {latestPendingOrder ? (
            <div className='mx-auto mt-4 flex max-w-3xl flex-col gap-3 rounded-3xl border border-sky-200/80 bg-white/96 px-5 py-4 text-left shadow-sm dark:border-sky-500/30 dark:bg-slate-950/55'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-300'>
                  检测到待支付订单
                </Badge>
                <span className='text-sm text-slate-500 dark:text-slate-300'>订单号：{latestPendingOrder.trade_no}</span>
              </div>
              <div className='text-sm leading-6 text-slate-700 dark:text-slate-100'>
                你当前有一笔待支付订单：
                <span className='font-medium text-slate-900 dark:text-white'> {latestPendingOrder.plan.name} · {formatCurrency(latestPendingOrder.total_amount)}</span>
                。请前往订单页继续支付，避免重复下单。
              </div>
              <div>
                <Button asChild className='rounded-2xl'>
                  <Link to='/orders'>
                    前往订单页继续支付
                    <IconArrowRight className='size-4' />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          {latestProcessingOrder ? (
            <div className='mx-auto mt-4 flex max-w-3xl flex-col gap-3 rounded-3xl border border-violet-200/80 bg-white/96 px-5 py-4 text-left shadow-sm dark:border-violet-500/30 dark:bg-slate-950/55'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-300'>
                  检测到开通中订单
                </Badge>
                <span className='text-sm text-slate-500 dark:text-slate-300'>订单号：{latestProcessingOrder.trade_no}</span>
              </div>
              <div className='text-sm leading-6 text-slate-700 dark:text-slate-100'>
                你当前有一笔开通中的订单：
                <span className='font-medium text-slate-900 dark:text-white'> {latestProcessingOrder.plan.name} · {formatCurrency(latestProcessingOrder.total_amount)}</span>
                。建议先前往订单页查看最新状态，等待系统完成开通。
              </div>
              <div>
                <Button asChild className='rounded-2xl' variant='outline'>
                  <Link to='/orders'>
                    前往订单页查看状态
                    <IconArrowRight className='size-4' />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {recurringPlans.length ? (
        <div className='px-4 lg:px-6'>
          <div className='mx-auto max-w-6xl space-y-6'>
            <div className='space-y-3 text-center'>
              <div className='text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>周期套餐</div>
              <div className='text-sm text-slate-500 dark:text-muted-foreground'>按周期选择月付、季付、半年付或更长期限的套餐方案。</div>
            </div>

            {availableRecurringOptions.length ? (
              <div className='flex justify-center'>
                <div className='grid w-full gap-2 rounded-3xl border border-slate-200/80 bg-white/96 p-2 shadow-sm sm:inline-flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-center sm:rounded-full sm:p-1.5 dark:border-border/70 dark:bg-card'>
                  {availableRecurringOptions.map((option) => {
                    const active = activeRecurringPeriod === option.key
                    return (
                      <button
                        key={option.key}
                        type='button'
                        onClick={() => setSelectedRecurringPeriod(option.key)}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm transition sm:w-auto sm:rounded-full ${
                          active
                            ? 'bg-slate-900 text-white shadow-sm dark:bg-primary dark:text-primary-foreground'
                            : 'text-slate-500 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-background/60'
                        }`}
                      >
                        <span>{option.label}</span>
                        {option.badge ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                            {option.badge}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className='grid gap-6 xl:grid-cols-3'>
              {recurringPlans.map((plan) => {
                const isCurrent = currentPlanName.includes(plan.name)
                const isRecommended = plan.id === recommendedPlanId
                const highlights = getPlanHighlights(plan.name, plan.transfer_enable)
                const yearSaving = getYearSaving(plan)
                const recurringPeriods = getRecurringPeriods(plan)
                const cardPeriod = recurringPeriods.some((option) => option.key === activeRecurringPeriod)
                  ? activeRecurringPeriod
                  : (recurringPeriods[0]?.key ?? activeRecurringPeriod)
                const displayPrice = getPlanPrice(plan, cardPeriod)
                const activeOption = getRecurringPeriodOption(cardPeriod)

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex h-full flex-col rounded-[2rem] border bg-white/98 shadow-sm transition-all dark:border-border/70 dark:bg-card ${
                      isRecommended
                        ? 'border-slate-900 shadow-xl shadow-slate-200/55 xl:-translate-y-3 dark:border-primary dark:shadow-none'
                        : 'border-slate-200/80'
                    } ${isCurrent ? 'ring-1 ring-sky-200 dark:ring-sky-500/20' : ''}`}
                  >
                    {isRecommended ? (
                      <div className='absolute inset-x-0 -top-3 flex justify-center'>
                        <Badge className='rounded-full border-slate-900 bg-slate-900 px-4 py-1 text-white shadow-sm dark:border-primary dark:bg-primary dark:text-primary-foreground'>
                          最受欢迎
                        </Badge>
                      </div>
                    ) : null}

                    <CardContent className='flex flex-1 flex-col p-8'>
                      <div className='space-y-3'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                          <div className='break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>{plan.name}</div>
                          {isCurrent ? (
                            <Badge variant='outline' className='rounded-full border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300'>
                              当前套餐
                            </Badge>
                          ) : null}
                        </div>
                        <p className='min-h-12 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>
                          {plan.content || '适合稳定访问与多设备连接场景。'}
                        </p>
                      </div>

                      <div className='mt-10 space-y-3'>
                        <div className='flex flex-wrap items-end gap-2'>
                          <span className='text-5xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>{formatCurrency(displayPrice)}</span>
                          <span className='pb-2 text-sm text-slate-500 dark:text-muted-foreground'>{activeOption.cycleSuffix}</span>
                        </div>
                        <div className='flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-muted-foreground'>
                          {recurringPeriods.map((option) => (
                            <span key={option.key}>{option.shortLabel} {formatCurrency(getPlanPrice(plan, option.key))}</span>
                          ))}
                        </div>
                        {yearSaving ? (
                          <div className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'>
                            <IconSparkles className='size-3.5' />
                            年付预计节省 {formatCurrency(yearSaving)}
                          </div>
                        ) : null}
                      </div>

                      <Button
                        onClick={() => handlePurchase(plan, cardPeriod, '当前套餐不支持该计费周期')}
                        disabled={createOrderMutation.isPending || displayPrice == null}
                        variant={isRecommended || cardPeriod === 'year_price' ? 'default' : 'outline'}
                        className={`mt-8 h-11 w-full rounded-2xl text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-55 ${
                          isRecommended
                            ? 'bg-slate-900 text-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.45)] hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90'
                            : cardPeriod === 'year_price'
                              ? 'bg-slate-900/95 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90'
                              : 'bg-white/90 dark:bg-transparent'
                        }`}
                      >
                        {createOrderMutation.isPending
                          ? '创建订单中...'
                          : latestPendingOrder
                            ? '前往订单页继续支付'
                            : latestProcessingOrder
                              ? '前往订单页查看状态'
                              : isCurrent
                                ? '继续购买当前套餐'
                                : '立即购买'}
                      </Button>

                      <div className='mt-8 h-px bg-slate-200/80 dark:bg-border' />

                      <div className='mt-6 space-y-4'>
                        <div className='text-sm font-medium text-slate-900 dark:text-foreground'>包含内容</div>
                        <div className='space-y-3'>
                          {highlights.map((item) => (
                            <div key={item} className='flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground'>
                              <IconCheck className='size-4 text-slate-900 dark:text-primary' />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className='mt-6 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>
                        {isCurrent
                          ? '你当前正在使用这个套餐，可按到期时间决定是否续费或升级。'
                          : cardPeriod === 'year_price'
                            ? '推荐优先看年付，整体价格通常更划算。'
                            : isRecommended
                              ? '这是更均衡的选择，适合多数用户长期使用。'
                              : '如果你的设备数或流量需求较低，这个档位会更划算。'}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {oneTimePlans.length ? (
        <div className='px-4 lg:px-6'>
          <div className='mx-auto max-w-6xl space-y-6'>
            <div className='space-y-3 text-center'>
              <div className='text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>一次性套餐</div>
              <div className='text-sm text-slate-500 dark:text-muted-foreground'>适合按流量购买、临时加量或一次性资源补充场景。</div>
            </div>

            <div className='grid gap-6 xl:grid-cols-3'>
              {oneTimePlans.map((plan) => {
                const oneTimePeriods = getOneTimePeriods(plan)
                const primaryPeriod = oneTimePeriods[0]
                const primaryPrice = primaryPeriod ? getPlanPrice(plan, primaryPeriod.key) : null
                const highlights = getPlanHighlights(plan.name, plan.transfer_enable, 'oneTime')
                const isRecommended = plan.id === recommendedOneTimePlanId

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex h-full flex-col rounded-[2rem] border bg-white/98 shadow-sm transition-all dark:border-border/70 dark:bg-card ${
                      isRecommended
                        ? 'border-slate-900 shadow-xl shadow-slate-200/55 xl:-translate-y-3 dark:border-primary dark:shadow-none'
                        : 'border-slate-200/80'
                    }`}
                  >
                    {isRecommended ? (
                      <div className='absolute inset-x-0 -top-3 flex justify-center'>
                        <Badge className='rounded-full border-slate-900 bg-slate-900 px-4 py-1 text-white shadow-sm dark:border-primary dark:bg-primary dark:text-primary-foreground'>
                          最受欢迎
                        </Badge>
                      </div>
                    ) : null}
                    <CardContent className='flex flex-1 flex-col p-8'>
                      <div className='space-y-3'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <div className='break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>{plan.name}</div>
                          <Badge variant='outline' className='rounded-full bg-white/90 dark:bg-transparent'>一次性</Badge>
                        </div>
                        <p className='min-h-12 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>
                          {plan.content || '适合临时补充流量与短期扩容。'}
                        </p>
                      </div>

                      <div className='mt-10 space-y-3'>
                        <div className='flex flex-wrap items-end gap-2'>
                          <span className='text-5xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>{formatCurrency(primaryPrice ?? 0)}</span>
                          <span className='pb-2 text-sm text-slate-500 dark:text-muted-foreground'>{primaryPeriod?.label ?? '/ 一次性'}</span>
                        </div>
                        <div className='flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-muted-foreground'>
                          {oneTimePeriods.map((option) => (
                            <span key={option.key}>{option.summaryLabel} {formatCurrency(getPlanPrice(plan, option.key))}</span>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => primaryPeriod ? handlePurchase(plan, primaryPeriod.key) : undefined}
                        disabled={createOrderMutation.isPending || primaryPeriod == null || primaryPrice == null}
                        variant={isRecommended ? 'default' : 'outline'}
                        className={`mt-8 h-11 w-full rounded-2xl text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-55 ${
                          isRecommended
                            ? 'bg-slate-900 text-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.45)] hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90'
                            : 'bg-white/90 dark:bg-transparent'
                        }`}
                      >
                        {createOrderMutation.isPending
                          ? '创建订单中...'
                          : latestPendingOrder
                            ? '前往订单页继续支付'
                            : latestProcessingOrder
                              ? '前往订单页查看状态'
                              : '立即购买'}
                      </Button>

                      <div className='mt-8 h-px bg-slate-200/80 dark:bg-border' />

                      <div className='mt-6 space-y-4'>
                        <div className='text-sm font-medium text-slate-900 dark:text-foreground'>包含内容</div>
                        <div className='space-y-3'>
                          {highlights.map((item) => (
                            <div key={item} className='flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground'>
                              <IconCheck className='size-4 text-slate-900 dark:text-primary' />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className='mt-6 text-sm leading-6 text-slate-500 dark:text-muted-foreground'>
                        一次性套餐更适合短期补充与按需购买，不会受周期切换限制。
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
