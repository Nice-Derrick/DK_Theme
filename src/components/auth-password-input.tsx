import * as React from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type AuthPasswordInputProps = React.ComponentProps<typeof Input> & {
  capsMessage?: string
}

export const AuthPasswordInput = React.forwardRef<HTMLInputElement, AuthPasswordInputProps>(function AuthPasswordInput(
  { className, capsMessage = '已开启大写锁定', onBlur, onFocus, onKeyDown, onKeyUp, ...props },
  ref,
) {
  const [visible, setVisible] = React.useState(false)
  const [capsLockOn, setCapsLockOn] = React.useState(false)

  const updateCapsLock = React.useCallback((event: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent
    if ('getModifierState' in nativeEvent && typeof nativeEvent.getModifierState === 'function') {
      setCapsLockOn(Boolean(nativeEvent.getModifierState('CapsLock')))
    }
  }, [])

  return (
    <div className='relative'>
      <Input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn(
          'transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-primary/20 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20',
          className,
          'pr-10',
          capsLockOn && 'pr-36',
        )}
        onFocus={(event) => {
          updateCapsLock(event)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setCapsLockOn(false)
          onBlur?.(event)
        }}
        onKeyDown={(event) => {
          updateCapsLock(event)
          onKeyDown?.(event)
        }}
        onKeyUp={(event) => {
          updateCapsLock(event)
          onKeyUp?.(event)
        }}
      />

      <div className='pointer-events-none absolute inset-y-0 right-10 flex items-center'>
        <div
          className={cn(
            'flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] font-medium tracking-[0.02em] shadow-sm backdrop-blur-sm transition-all duration-200',
            capsLockOn
              ? 'translate-x-0 opacity-100 border-primary/20 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/15 dark:text-primary'
              : 'translate-x-2 opacity-0',
          )}
        >
          <AlertCircle className='size-3 shrink-0' />
          <span>{capsMessage}</span>
        </div>
      </div>

      <button
        type='button'
        aria-label={visible ? '隐藏密码' : '显示密码'}
        onClick={() => setVisible((value) => !value)}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 transition',
          capsLockOn ? 'text-primary/80 hover:text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {visible ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
      </button>
    </div>
  )
})
