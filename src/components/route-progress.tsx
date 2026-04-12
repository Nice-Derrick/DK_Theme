import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import {
  getNavigationProgressSignal,
  subscribeNavigationProgress,
} from '@/lib/navigation-progress'

export function RouteProgress() {
  const location = useLocation()
  const isFetching = useIsFetching()
  const navigationSignal = useSyncExternalStore(
    subscribeNavigationProgress,
    getNavigationProgressSignal,
    getNavigationProgressSignal,
  )
  const mountedRef = useRef(false)
  const finishTimeoutRef = useRef<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (navigationSignal === 0) return

    setVisible(true)
    setProgress((current) => Math.max(current, 10))
  }, [navigationSignal])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    setVisible(true)
    setProgress((current) => Math.max(current, 18))
  }, [location.key])

  useEffect(() => {
    if (!visible) return

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current)
      finishTimeoutRef.current = null
    }

    if (isFetching > 0) {
      const interval = window.setInterval(() => {
        setProgress((current) => {
          if (current >= 88) return current
          const nextStep = current < 40 ? 10 : current < 70 ? 6 : 2
          return Math.min(current + nextStep, 88)
        })
      }, 180)

      return () => window.clearInterval(interval)
    }

    if (progress === 0) return

    setProgress(100)
    finishTimeoutRef.current = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 260)

    return () => {
      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current)
        finishTimeoutRef.current = null
      }
    }
  }, [isFetching, progress, visible])

  if (!visible) return null

  return (
    <div className='pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 bg-transparent'>
      <div
        className='h-full rounded-r-full bg-primary shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_50%,transparent)] transition-[width,opacity] duration-200 ease-out'
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  )
}
