import { IconMoonStars, IconSunHigh } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <Button
      variant='outline'
      size='icon'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className='size-9 rounded-full md:h-9 md:w-auto md:gap-2 md:px-3'
    >
      {isDark ? <IconSunHigh className='size-4' /> : <IconMoonStars className='size-4' />}
      <span className='hidden md:inline'>{isDark ? '浅色模式' : '深色模式'}</span>
      <span className='sr-only'>{isDark ? '切换到浅色模式' : '切换到深色模式'}</span>
    </Button>
  )
}
