import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function KpiCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <Card>
      <CardContent className='flex items-start justify-between p-6'>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>{label}</p>
          <p className='text-2xl font-semibold'>{value}</p>
          {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
        </div>
        {icon ? <div className='text-primary'>{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
