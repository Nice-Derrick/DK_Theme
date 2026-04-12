import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const commonDomains = ['qq.com', 'gmail.com', '163.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'foxmail.com', '126.com']

type AuthEmailInputProps = React.ComponentProps<typeof Input>

export const AuthEmailInput = React.forwardRef<HTMLInputElement, AuthEmailInputProps>(function AuthEmailInput(
  { className, onChange, onFocus, onBlur, onKeyDown, name, ...props },
  ref,
) {
  const [value, setValue] = React.useState(typeof props.defaultValue === 'string' ? props.defaultValue : '')
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const blurTimerRef = React.useRef<number | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const assignRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const suggestions = React.useMemo(() => {
    const input = value.trim()
    if (!input) return []

    const atIndex = input.indexOf('@')
    const localPart = atIndex >= 0 ? input.slice(0, atIndex) : input
    const domainPart = atIndex >= 0 ? input.slice(atIndex + 1) : ''

    if (!localPart) return []
    if (input.includes('@') && input.endsWith('@')) {
      return commonDomains.map((domain) => `${localPart}@${domain}`)
    }

    if (!input.includes('@')) {
      return commonDomains.slice(0, 4).map((domain) => `${localPart}@${domain}`)
    }

    return commonDomains
      .filter((domain) => domain.startsWith(domainPart.toLowerCase()))
      .map((domain) => `${localPart}@${domain}`)
  }, [value])

  const visibleSuggestions = React.useMemo(() => suggestions.filter((item) => item !== value).slice(0, 6), [suggestions, value])

  const emitChange = React.useCallback(
    (nextValue: string) => {
      setValue(nextValue)
      onChange?.({ target: { name, value: nextValue } } as React.ChangeEvent<HTMLInputElement>)
    },
    [name, onChange],
  )

  const restoreFocus = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return
      input.focus()
      const length = input.value.length
      input.setSelectionRange(length, length)
    })
  }, [])

  const selectSuggestion = React.useCallback(
    (suggestion: string) => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current)
      emitChange(suggestion)
      setOpen(false)
      setActiveIndex(0)
      restoreFocus()
    },
    [emitChange, restoreFocus],
  )

  React.useEffect(() => {
    setActiveIndex((current) => {
      if (visibleSuggestions.length === 0) return 0
      return Math.min(current, visibleSuggestions.length - 1)
    })
  }, [visibleSuggestions])

  React.useEffect(() => {
    return () => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current)
    }
  }, [])

  return (
    <div className='relative'>
      <Input
        {...props}
        ref={assignRef}
        name={name}
        type='email'
        value={value}
        className={cn(
          'transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-primary/20 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20',
          className,
        )}
        onChange={(event) => {
          emitChange(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={(event) => {
          if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current)
          setOpen(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          blurTimerRef.current = window.setTimeout(() => {
            setOpen(false)
            setActiveIndex(0)
          }, 120)
          onBlur?.(event)
        }}
        onKeyDown={(event) => {
          if (open && visibleSuggestions.length > 0) {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((current) => (current + 1) % visibleSuggestions.length)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((current) => (current - 1 + visibleSuggestions.length) % visibleSuggestions.length)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              selectSuggestion(visibleSuggestions[activeIndex] ?? visibleSuggestions[0])
            } else if (event.key === 'Tab' && !event.shiftKey) {
              event.preventDefault()
              selectSuggestion(visibleSuggestions[activeIndex] ?? visibleSuggestions[0])
            } else if (event.key === 'Escape') {
              setOpen(false)
              setActiveIndex(0)
            }
          }
          onKeyDown?.(event)
        }}
      />
      {open && visibleSuggestions.length > 0 ? (
        <div className='absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-primary/10 bg-background/92 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
          <div className='border-b border-primary/8 px-3 py-2 text-[11px] font-medium tracking-[0.02em] text-muted-foreground'>常用邮箱补全</div>
          <div className='grid gap-1 p-1.5'>
            {visibleSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type='button'
                className={cn(
                  'rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150',
                  'hover:bg-primary/10 hover:text-primary',
                  index === activeIndex && 'bg-primary/10 text-primary shadow-sm',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
})
