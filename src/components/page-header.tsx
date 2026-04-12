import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

export function PageHeader({
  badge,
  title,
  description,
  actions,
}: {
  badge: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-4 px-4 lg:px-6'>
      <div className='space-y-3'>
        <Badge variant='outline' className='rounded-full border-primary/15 bg-primary/8 px-2.5 py-1 text-primary'>
          {badge}
        </Badge>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>{title}</h1>
          {description ? <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-muted-foreground'>{description}</p> : null}
        </div>
      </div>
      {actions ? <div className='flex flex-wrap items-center gap-3 [&>*]:rounded-full'>{actions}</div> : null}
    </div>
  )
}
