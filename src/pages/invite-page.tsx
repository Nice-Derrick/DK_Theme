import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift, Link as LinkIcon, Plus, ReceiptText, Users, Wallet } from 'lucide-react'
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
import { copyText } from '@/lib/clipboard'
import { generateInviteCode, getInviteStat } from '@/lib/api/services/invite'
import { formatCurrency, formatDateTime } from '@/lib/format'

type WithdrawalChannel = 'alipay' | 'usdt' | 'paypal'

type CommissionRecord = {
  id: string
  title: string
  amount: number
  created_at: number
  type: 'commission' | 'withdraw' | 'transfer'
  status: 'success' | 'pending'
  channel?: WithdrawalChannel
  account?: string
}

function getInviteLink(code?: string) {
  if (!code || typeof window === 'undefined') return ''
  return `${window.location.origin}/register?code=${encodeURIComponent(code)}`
}

function getRecordTypeLabel(type: CommissionRecord['type']) {
  switch (type) {
    case 'commission':
      return '佣金发放'
    case 'withdraw':
      return '佣金提现'
    case 'transfer':
      return '划转到余额'
  }
}

function getWithdrawalChannelLabel(channel?: WithdrawalChannel) {
  switch (channel) {
    case 'alipay':
      return '支付宝'
    case 'usdt':
      return 'USDT'
    case 'paypal':
      return 'PayPal'
    default:
      return ''
  }
}

export function InvitePage() {
  const queryClient = useQueryClient()
  const inviteQuery = useQuery({ queryKey: ['invite'], queryFn: getInviteStat })
  const invite = inviteQuery.data

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [withdrawChannel, setWithdrawChannel] = useState<WithdrawalChannel>('alipay')
  const [withdrawAccount, setWithdrawAccount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [commissionBalance, setCommissionBalance] = useState(0)
  const [commissionPending, setCommissionPending] = useState(0)
  const [records, setRecords] = useState<CommissionRecord[]>([])

  useEffect(() => {
    if (!invite) return
    setCommissionBalance(invite.stat.commission_balance)
    setCommissionPending(invite.stat.commission_pending)
    setRecords([
      {
        id: 'commission-1',
        title: '邀请用户 INVITE-PLUS 产生返佣',
        amount: 1800,
        created_at: 1712731200,
        type: 'commission',
        status: 'success',
      },
      {
        id: 'commission-2',
        title: '邀请用户 INVITE-GIFT 订单待结算',
        amount: 1200,
        created_at: 1712698920,
        type: 'commission',
        status: 'pending',
      },
    ])
  }, [invite])

  const hasAvailableInviteCode = Boolean(invite?.codes.some((item) => item.status === 0))
  const primaryCode = invite?.codes.find((item) => item.status === 0)?.code ?? invite?.codes[0]?.code
  const primaryInviteLink = useMemo(() => getInviteLink(primaryCode), [primaryCode])
  const availableBalanceInCents = commissionBalance

  const generateInviteMutation = useMutation({
    mutationFn: generateInviteCode,
    onSuccess: async (result) => {
      const previousCodes = invite?.codes.map((item) => item.code) ?? []
      const updatedInvite = await queryClient.fetchQuery({
        queryKey: ['invite'],
        queryFn: getInviteStat,
        staleTime: 0,
      })

      const newCode = typeof result === 'object' && result && 'code' in result && typeof result.code === 'string'
        ? result.code
        : updatedInvite.codes.find((item) => !previousCodes.includes(item.code))?.code

      toast.success(newCode ? `邀请码已生成：${newCode}` : '邀请码已生成')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '生成邀请码失败，请稍后再试'
      toast.error(message)
    },
  })

  async function copyInviteLink() {
    if (!primaryInviteLink) {
      toast.error('当前没有可复制的邀请码链接')
      return
    }

    try {
      await copyText(primaryInviteLink)
      toast.success('邀请链接已复制')
    } catch {
      toast.error('复制失败，请稍后再试')
    }
  }


  function handleWithdraw() {
    const account = withdrawAccount.trim()

    if (!withdrawChannel) {
      toast.error('请选择提现渠道')
      return
    }

    if (!account) {
      toast.error('请输入提现账号')
      return
    }

    if (commissionBalance <= 0) {
      toast.error('当前没有可提现返利')
      return
    }

    const channelLabel = getWithdrawalChannelLabel(withdrawChannel)
    const amount = commissionBalance

    setCommissionBalance(0)
    setRecords((prev) => [
      {
        id: `withdraw-${Date.now()}`,
        title: `${channelLabel} 提现申请`,
        amount: Math.round(amount * 100),
        created_at: Math.floor(Date.now() / 1000),
        type: 'withdraw',
        status: 'pending',
        channel: withdrawChannel,
        account,
      },
      ...prev,
    ])
    setWithdrawChannel('alipay')
    setWithdrawAccount('')
    setWithdrawOpen(false)
    toast.success(`已提交${channelLabel}提现申请`)
  }

  function handleTransfer() {
    const amount = Number(transferAmount)

    if (!amount || amount <= 0) {
      toast.error('请输入正确的划转金额')
      return
    }

    if (amount > commissionBalance) {
      toast.error('划转金额不能超过当前可提现返利')
      return
    }

    setCommissionBalance((value) => Number((value - amount).toFixed(2)))
    setRecords((prev) => [
      {
        id: `transfer-${Date.now()}`,
        title: '推广佣金划转到余额',
        amount: Math.round(amount * 100),
        created_at: Math.floor(Date.now() / 1000),
        type: 'transfer',
        status: 'success',
      },
      ...prev,
    ])
    setTransferAmount('')
    setTransferOpen(false)
    toast.success('佣金已划转到余额')
  }

  return (
    <div className='space-y-8'>
      <PageHeader
        badge='邀请返利'
        title='邀请返利'
        actions={
          <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={copyInviteLink}>
            <LinkIcon className='size-4' />
            复制邀请链接
          </Button>
        }
      />

      <div className='px-4 lg:px-6'>
        <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
          <CardContent className='grid gap-6 p-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center'>
            <div className='space-y-4'>
              <Badge variant='outline' className='bg-white/90 dark:bg-transparent'>推广概览</Badge>
              <div className='space-y-2'>
                <div className='text-3xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>邀请链接与返利概览</div>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                  <Users className='size-4' />
                  已邀请用户
                </div>
                <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>{invite?.stat.invite_count ?? 0}</div>
              </div>
              <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                  <Gift className='size-4' />
                  可提现返利
                </div>
                <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>
                  {formatCurrency(availableBalanceInCents)}
                </div>
              </div>
              <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground'>
                  <LinkIcon className='size-4' />
                  待结算返利
                </div>
                <div className='mt-3 text-2xl font-semibold text-slate-900 dark:text-foreground'>
                  {formatCurrency(commissionPending)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='px-4 lg:px-6'>
        <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
          <div className='space-y-6'>
            <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
              <CardHeader>
                <CardTitle>邀请码管理</CardTitle>
                <CardDescription>创建和复制邀请码</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='rounded-3xl border border-slate-200/80 bg-slate-50/90 p-5 dark:border-border/70 dark:bg-background/35'>
                  <div className='text-sm text-slate-500 dark:text-muted-foreground'>当前邀请码</div>
                  <div className='mt-2 break-all text-xl font-semibold tracking-wide text-slate-900 dark:text-foreground'>{primaryCode ?? '--'}</div>
                  <div className='mt-3 break-all text-sm text-slate-500 dark:text-muted-foreground'>
                    {primaryInviteLink || '当前暂无可分享的邀请链接'}
                  </div>
                </div>

                <div className='grid gap-3 sm:grid-cols-2'>
                  <Button className='w-full rounded-2xl' onClick={copyInviteLink}>
                    <LinkIcon className='size-4' />
                    复制链接
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full rounded-2xl bg-white/90 dark:bg-transparent'
                    onClick={() => generateInviteMutation.mutate()}
                    disabled={generateInviteMutation.isPending || hasAvailableInviteCode}
                    title={hasAvailableInviteCode ? '当前已有可用邀请码，请直接复制使用' : undefined}
                  >
                    <Plus className='size-4' />
                    {generateInviteMutation.isPending ? '生成中…' : hasAvailableInviteCode ? '已有可用邀请码' : '生成邀请码'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
              <CardHeader>
                <CardTitle>佣金操作</CardTitle>
                <CardDescription>提现与余额划转</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3 sm:grid-cols-2'>
                <Button className='w-full rounded-2xl' onClick={() => setWithdrawOpen(true)}>
                  <Wallet className='size-4' />
                  推广佣金提现
                </Button>
                <Button variant='outline' className='w-full rounded-2xl bg-white/90 dark:bg-transparent' onClick={() => setTransferOpen(true)}>
                  <Gift className='size-4' />
                  划转到余额
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle>佣金记录</CardTitle>
                  <CardDescription>返利记录</CardDescription>
                </div>
                <Badge variant='outline' className='bg-white/90 dark:bg-transparent'>共 {records.length} 条佣金记录</Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-foreground'>
                  <ReceiptText className='size-4 text-primary' />
                  佣金发放记录
                </div>
                {records.map((item) => (
                  <div
                    key={item.id}
                    className='flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35 md:flex-row md:items-center md:justify-between'
                  >
                    <div className='min-w-0 space-y-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <div className='break-words font-medium text-slate-900 dark:text-foreground'>{item.title}</div>
                        <Badge
                          variant='outline'
                          className={item.status === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'bg-white/90 dark:bg-transparent'}
                        >
                          {item.status === 'success' ? '已完成' : '处理中'}
                        </Badge>
                        <Badge variant='outline' className='bg-white/90 dark:bg-transparent'>
                          {getRecordTypeLabel(item.type)}
                        </Badge>
                      </div>
                      <div className='text-sm text-slate-500 dark:text-muted-foreground'>记录时间：{formatDateTime(item.created_at)}</div>
                      {item.type === 'withdraw' && item.channel && item.account ? (
                        <div className='break-all text-sm text-slate-500 dark:text-muted-foreground'>
                          提现渠道：{getWithdrawalChannelLabel(item.channel)} · 账号：{item.account}
                        </div>
                      ) : null}
                    </div>
                    <div className='text-lg font-semibold text-slate-900 dark:text-foreground'>{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>


            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>推广佣金提现</DialogTitle>
            <DialogDescription>填写提现渠道与账号后提交申请。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
              当前可提现返利：{formatCurrency(availableBalanceInCents)}
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <div className='text-sm font-medium text-slate-900 dark:text-foreground'>提现渠道</div>
                <Select value={withdrawChannel} onValueChange={(value) => setWithdrawChannel(value as WithdrawalChannel)}>
                  <SelectTrigger className='bg-white/90 dark:bg-input/30'>
                    <SelectValue placeholder='请选择提现渠道' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='alipay'>支付宝</SelectItem>
                    <SelectItem value='usdt'>USDT</SelectItem>
                    <SelectItem value='paypal'>PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <div className='text-sm font-medium text-slate-900 dark:text-foreground'>提现账号</div>
                <Input
                  placeholder={withdrawChannel === 'usdt' ? '请输入 USDT 钱包地址' : '请输入收款账号'}
                  value={withdrawAccount}
                  onChange={(event) => setWithdrawAccount(event.target.value)}
                  className='bg-white/90 dark:bg-input/30'
                />
              </div>
            </div>
            <div className='rounded-2xl border border-dashed border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>
              本次申请金额：{formatCurrency(availableBalanceInCents)}
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='w-full sm:w-auto' onClick={handleWithdraw}>提交提现</Button>
              <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setWithdrawOpen(false)}>取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>划转佣金到余额</DialogTitle>
            <DialogDescription>输入金额后将返利划转到账户余额。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
              当前可划转返利：{formatCurrency(availableBalanceInCents)}
            </div>
            <Input
              type='number'
              min='0'
              step='0.01'
              placeholder='请输入划转金额'
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
              className='bg-white/90 dark:bg-input/30'
            />
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='w-full sm:w-auto' onClick={handleTransfer}>确认划转</Button>
              <Button variant='outline' className='w-full bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => setTransferOpen(false)}>取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
