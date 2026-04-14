import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { RouteChunkErrorBoundary } from '@/components/route-chunk-error-boundary';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

function AppShellOutletFallback() {
  return <div className='flex min-h-[320px] items-center justify-center px-4 text-sm text-muted-foreground'>页面加载中…</div>;
}

export function AppShell() {
  const location = useLocation()
  const resetKey = `${location.pathname}${location.search}`

  return (
    <SidebarProvider
      className='bg-background'
      style={{
        ['--header-height' as string]: 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-6 py-6'>
            <RouteChunkErrorBoundary resetKey={resetKey}>
              <Suspense fallback={<AppShellOutletFallback />}>
                <Outlet />
              </Suspense>
            </RouteChunkErrorBoundary>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
