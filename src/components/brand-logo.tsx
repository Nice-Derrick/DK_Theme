import { Shield } from 'lucide-react';
import { appConfig } from '@/lib/config';

export function BrandLogo() {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary'>
        <Shield className='size-5' />
      </div>
      <div>
        <div className='font-semibold tracking-tight'>{appConfig.appName}</div>
        <div className='text-xs text-muted-foreground'>账户与服务管理</div>
      </div>
    </div>
  );
}
