import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellRing, BookText, ExternalLink, LifeBuoy, Shield, TabletSmartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  getKnowledgeArticleDetail,
  getKnowledgeArticles,
  getNotices,
} from '@/lib/api/services/knowledge'
import { formatDateTime } from '@/lib/format'
import type { KnowledgeArticle } from '@/lib/api/types'

type TutorialDoc = {
  id: string
  title: string
  platform: string
  summary: string
  steps: string[]
  tag: string
}

const overviewDocs = [
  {
    title: '首次使用：3 分钟完成客户端配置',
    icon: TabletSmartphone,
    summary: '把导入步骤拆成系统化文档，避免在页面里堆大段说明。',
    tag: '新手必读',
  },
  {
    title: '订阅无法更新时的排查步骤',
    icon: BookText,
    summary: '常见于网络权限、剪贴板权限、客户端缓存与节点格式问题。',
    tag: '故障排查',
  },
  {
    title: '多设备登录与安全使用规范',
    icon: Shield,
    summary: '建议把共享风险、设备数量限制与账号保护单独沉淀为文档。',
    tag: '安全规范',
  },
]

const tutorials: TutorialDoc[] = [
  {
    id: 'clash-meta',
    title: 'Clash Meta 导入教程',
    platform: 'Windows / macOS',
    tag: '桌面端',
    summary: '适合希望使用规则分流和配置切换的桌面端用户。',
    steps: [
      '下载安装 Clash Meta 或兼容的 mihomo 图形客户端。',
      '登录用户中心，进入客户端下载页面复制订阅链接。',
      '打开客户端的配置或订阅管理，选择从 URL 导入。',
      '粘贴订阅后更新配置，启用新配置并选择节点即可。',
    ],
  },
  {
    id: 'v2rayn',
    title: 'v2rayN 导入教程',
    platform: 'Windows',
    tag: '桌面端',
    summary: '适合 Windows 用户日常使用，导入方式直观。',
    steps: [
      '下载并解压 v2rayN，首次启动请允许必要的系统权限。',
      '在客户端下载页复制订阅链接。',
      '回到 v2rayN，进入订阅分组，添加新的订阅地址。',
      '保存后执行更新订阅，再选择节点并启用系统代理。',
    ],
  },
  {
    id: 'shadowrocket',
    title: 'Shadowrocket 导入教程',
    platform: 'iOS',
    tag: 'iOS',
    summary: '支持一键导入、扫码导入和手动粘贴订阅。',
    steps: [
      '先从客户端下载页点击一键导入，若系统成功唤起 Shadowrocket 可直接添加。',
      '若一键导入失败，可改为点击复制订阅，打开 Shadowrocket 后新建订阅粘贴地址。',
      '也可以在客户端下载页打开订阅二维码，用 Shadowrocket 扫码导入。',
      '导入完成后更新订阅并启用节点即可。',
    ],
  },
  {
    id: 'stash',
    title: 'Stash 导入教程',
    platform: 'iOS',
    tag: 'iOS',
    summary: '适合偏好策略组与规则配置的 Apple 用户。',
    steps: [
      '安装 Stash 后进入配置或订阅相关页面。',
      '在用户中心客户端下载页复制订阅链接。',
      '回到 Stash，选择新建远程配置或订阅，粘贴链接后保存。',
      '更新配置并启用默认策略组后即可开始使用。',
    ],
  },
]

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

function renderInlineKnowledgeText(text: string) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  const nodes: Array<string | ReactNode> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    nodes.push(
      <a
        key={`${match[2]}-${match.index}`}
        href={match[2]}
        target='_blank'
        rel='noreferrer'
        className='font-medium text-primary underline underline-offset-4 hover:opacity-80'
      >
        {match[1]}
      </a>,
    )

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : text
}

function renderKnowledgeBody(body?: string) {
  if (!body?.trim()) return '该文档暂无正文内容。'

  const lines = body.split(/\r?\n/)

  return (
    <div className='space-y-3'>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim()

        if (!line) {
          return <div key={`space-${index}`} className='h-2' />
        }

        if (line === '---') {
          return <div key={`divider-${index}`} className='my-1 border-t border-slate-200/80 dark:border-border/70' />
        }

        if (/^[^\[]+[：:]$/.test(line)) {
          return (
            <div key={`heading-${index}`} className='pt-1 text-sm font-semibold text-slate-900 dark:text-foreground'>
              {line}
            </div>
          )
        }

        return (
          <p key={`line-${index}`} className='text-sm leading-7 text-slate-700 dark:text-muted-foreground'>
            {renderInlineKnowledgeText(line)}
          </p>
        )
      })}
    </div>
  )
}

export function KnowledgePage() {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)
  const [articleDialogOpen, setArticleDialogOpen] = useState(false)

  const knowledgeQuery = useQuery({ queryKey: ['knowledge-articles'], queryFn: getKnowledgeArticles })
  const noticesQuery = useQuery({ queryKey: ['support-notices'], queryFn: getNotices })

  const articleDetailQuery = useQuery({
    queryKey: ['knowledge-article-detail', selectedArticleId],
    queryFn: () => getKnowledgeArticleDetail(selectedArticleId as number),
    enabled: selectedArticleId != null,
  })

  const articles = useMemo(() => knowledgeQuery.data ?? [], [knowledgeQuery.data])
  const notices = useMemo(() => noticesQuery.data ?? [], [noticesQuery.data])

  function openArticle(article: KnowledgeArticle) {
    setSelectedArticleId(article.id)
    setArticleDialogOpen(true)
  }

  return (
    <div className='space-y-8'>
      <PageHeader
        badge='帮助文档'
        title='帮助文档'
        actions={
          <Button variant='outline' asChild className='bg-white/90 dark:bg-transparent'>
            <a href='#support'>前往获取支持</a>
          </Button>
        }
      />

      <div className='grid gap-4 px-4 lg:px-6 lg:grid-cols-3'>
        {overviewDocs.map((doc) => {
          const Icon = doc.icon
          return (
            <Card key={doc.title} className='border-slate-200/90 bg-white/96 shadow-sm dark:border-border/70 dark:bg-card'>
              <CardHeader>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary'>
                    <Icon className='size-5' />
                  </div>
                  <Badge variant='outline'>{doc.tag}</Badge>
                </div>
                <CardTitle className='text-lg'>{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-sm text-muted-foreground'>{doc.summary}</p>
                <Button variant='ghost' className='px-0 text-primary' asChild>
                  <a href='#knowledge-list'>
                    打开文档
                    <ExternalLink className='size-4' />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div id='knowledge-list' className='px-4 lg:px-6'>
        <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
          <CardHeader>
            <CardTitle>知识库文章</CardTitle>
            <CardDescription>查看知识库文章列表与文档详情。</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {knowledgeQuery.isError ? (
              <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                <div className='text-base font-medium text-rose-700 dark:text-rose-300'>知识库加载失败</div>
                <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>{getErrorMessage(knowledgeQuery.error, '请稍后重试')}</div>
                <div className='mt-4'>
                  <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => knowledgeQuery.refetch()}>
                    重新加载
                  </Button>
                </div>
              </div>
            ) : knowledgeQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                  <div className='h-5 w-56 rounded-full bg-slate-200/80 dark:bg-white/10' />
                  <div className='mt-3 h-4 w-32 rounded-full bg-slate-200/60 dark:bg-white/5' />
                </div>
              ))
            ) : articles.length > 0 ? (
              articles.map((article) => (
                <button
                  key={article.id}
                  type='button'
                  onClick={() => openArticle(article)}
                  className='w-full rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 text-left transition hover:border-primary/30 hover:bg-white dark:border-border/70 dark:bg-background/35 dark:hover:bg-background/50'
                >
                  <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                    <div>
                      <div className='break-words text-base font-semibold text-slate-900 dark:text-foreground'>{article.title}</div>
                      <div className='mt-2 text-sm text-slate-500 dark:text-muted-foreground'>更新时间：{formatDateTime(article.updated_at)}</div>
                    </div>
                    <Badge variant='outline' className='bg-white/90 dark:bg-transparent'>查看详情</Badge>
                  </div>
                </button>
              ))
            ) : (
              <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>当前暂无帮助文档。</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div id='client-tutorials' className='grid gap-4 px-4 lg:px-6 lg:grid-cols-2'>
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} id={tutorial.id} className='scroll-mt-24 border-slate-200/90 bg-white/96 shadow-sm dark:border-border/70 dark:bg-card'>
            <CardHeader className='space-y-3'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <Badge variant='outline'>{tutorial.tag}</Badge>
                <span className='text-sm text-muted-foreground'>{tutorial.platform}</span>
              </div>
              <CardTitle className='text-xl'>{tutorial.title}</CardTitle>
              <p className='text-sm text-muted-foreground'>{tutorial.summary}</p>
            </CardHeader>
            <CardContent className='space-y-3'>
              {tutorial.steps.map((step, index) => (
                <div key={step} className='flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm'>
                  <div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary'>
                    {index + 1}
                  </div>
                  <p className='text-muted-foreground'>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div id='support' className='px-4 lg:px-6'>
        <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader>
              <div className='mb-3 flex items-center gap-3'>
                <div className='flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary'>
                  <BellRing className='size-5' />
                </div>
                <div>
                  <CardTitle>系统公告 / 支持提示</CardTitle>
                  <CardDescription>查看系统公告与服务通知。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {noticesQuery.isError ? (
                <div className='rounded-3xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'>
                  <div className='text-base font-medium text-rose-700 dark:text-rose-300'>支持公告加载失败</div>
                  <div className='mt-2 text-sm text-rose-600/90 dark:text-rose-200/80'>{getErrorMessage(noticesQuery.error, '请稍后重试')}</div>
                  <div className='mt-4'>
                    <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => noticesQuery.refetch()}>
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : noticesQuery.isLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                    <div className='h-5 w-40 rounded-full bg-slate-200/80 dark:bg-white/10' />
                    <div className='mt-3 h-4 w-full rounded-full bg-slate-200/60 dark:bg-white/5' />
                  </div>
                ))
              ) : notices.length > 0 ? (
                notices.map((notice) => (
                  <div key={notice.id} className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35'>
                    <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
                      <div className='break-words font-medium text-slate-900 dark:text-foreground'>{notice.title}</div>
                      <div className='text-sm text-slate-500 dark:text-muted-foreground'>{formatDateTime(notice.created_at)}</div>
                    </div>
                    <div className='mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-muted-foreground'>{notice.content}</div>
                  </div>
                ))
              ) : (
                <div className='rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-border/70 dark:bg-background/20 dark:text-muted-foreground'>当前暂无支持公告。</div>
              )}
            </CardContent>
          </Card>

          <Card className='border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader>
              <div className='mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary'>
                <LifeBuoy className='size-5' />
              </div>
              <CardTitle>获取支持</CardTitle>
              <CardDescription>需要人工协助时，可直接提交工单。</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-3xl border border-slate-200/80 bg-slate-50/85 p-5 text-sm leading-6 text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
                如需进一步协助，可直接前往工单页提交问题。
              </div>
              <div className='space-y-3'>
                <Button asChild className='w-full rounded-2xl'>
                  <Link to='/tickets'>前往工单页获取支持</Link>
                </Button>
                <Button asChild variant='outline' className='w-full rounded-2xl bg-white/90 dark:bg-transparent'>
                  <a href='#knowledge-list'>先查看帮助文档</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
        <DialogContent className='flex max-h-[88vh] w-[min(96vw,72rem)] max-w-6xl flex-col overflow-hidden border-slate-200/90 bg-white/96 p-0 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader className='shrink-0 border-b border-slate-200/80 px-6 py-5 text-left dark:border-border/70 sm:px-8'>
            <DialogTitle className='pr-8 text-xl leading-8 sm:text-2xl'>
              {articleDetailQuery.data?.title ?? '文档详情'}
            </DialogTitle>
            <DialogDescription>文档详情</DialogDescription>
          </DialogHeader>
          <div className='min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7'>
            {articleDetailQuery.isError ? (
              <div className='rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'>
                {getErrorMessage(articleDetailQuery.error, '文档详情加载失败，请稍后重试')}
              </div>
            ) : articleDetailQuery.isLoading ? (
              <div className='space-y-3'>
                <div className='h-5 w-48 rounded-full bg-slate-200/80 dark:bg-white/10' />
                <div className='h-20 rounded-2xl bg-slate-100/80 dark:bg-white/5' />
                <div className='h-20 rounded-2xl bg-slate-100/70 dark:bg-white/5' />
              </div>
            ) : (
              <div className='mx-auto max-w-4xl rounded-2xl border border-slate-200/80 bg-slate-50/85 p-5 dark:border-border/70 dark:bg-background/35 sm:p-7'>
                {renderKnowledgeBody(articleDetailQuery.data?.body)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
