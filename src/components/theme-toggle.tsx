import { IconMoonStars, IconSunHigh } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className='gap-2 rounded-full'
    >
      {isDark ? <IconSunHigh className='size-4' /> : <IconMoonStars className='size-4' />}
      <span>{isDark ? '浅色模式' : '深色模式'}</span>
    </Button>
  )
}
