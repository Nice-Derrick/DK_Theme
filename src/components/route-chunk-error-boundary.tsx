import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type RouteChunkErrorBoundaryProps = {
  children: ReactNode
  title?: string
  description?: string
  resetKey?: string
}

type RouteChunkErrorBoundaryState = {
  hasError: boolean
}

export class RouteChunkErrorBoundary extends Component<
  RouteChunkErrorBoundaryProps,
  RouteChunkErrorBoundaryState
> {
  state: RouteChunkErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route chunk failed to render', error, errorInfo)
  }

  componentDidUpdate(prevProps: RouteChunkErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className='flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200/80 bg-white/60 px-4 py-10 text-center dark:border-border/60 dark:bg-background/25'>
        <div className='text-base font-medium text-slate-900 dark:text-foreground'>
          {this.props.title ?? '页面加载失败'}
        </div>
        <div className='max-w-md text-sm text-slate-500 dark:text-muted-foreground'>
          {this.props.description ?? '当前页面资源加载异常，请刷新页面后重试。'}
        </div>
        <Button type='button' variant='outline' className='rounded-full' onClick={this.handleReload}>
          重新加载
        </Button>
      </div>
    )
  }
}
