import { Shield } from 'lucide-react';
import { appConfig } from '@/lib/config';

export function BrandLogo() {
  return (
    <div className='flex min-w-0 items-center gap-3'>
      <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary'>
        <Shield className='size-5' />
      </div>
      <div className='min-w-0'>
        <div className='truncate font-semibold tracking-tight'>{appConfig.appName}</div>
      </div>
    </div>
  )
}
