import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGlobe } from '@/components/auth-globe'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'

function useShowDesktopGlobe() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px) and (pointer: fine)')
    const update = () => setShow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return show
}

export function AuthLayout() {
  const showDesktopGlobe = useShowDesktopGlobe()

  return (
    <div className={`grid min-h-screen ${showDesktopGlobe ? 'xl:grid-cols-2' : ''}`}>
      <div className='relative flex flex-col gap-5 px-5 py-6 md:gap-6 md:p-10'>
        <div className='absolute right-6 top-6 z-10 md:right-10 md:top-10'>
          <ThemeToggle />
        </div>

        <div className='flex justify-center gap-2 md:justify-start'>
          <BrandLogo />
        </div>

        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-md'>
            <Outlet />
          </div>
        </div>
      </div>

      {showDesktopGlobe ? (
        <div className='relative hidden overflow-hidden bg-[radial-gradient(circle_at_top,rgba(135,160,210,0.18),transparent_32%),linear-gradient(180deg,#f7f9fc_0%,#edf2f8_100%)] xl:block dark:bg-[radial-gradient(circle_at_top,rgba(105,135,205,0.16),transparent_32%),linear-gradient(180deg,#0b1220_0%,#111a2a_100%)]'>
          <div className='absolute inset-0'>
            <AuthGlobe />
          </div>
        </div>
      ) : null}
    </div>
  )
}
