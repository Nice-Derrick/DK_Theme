import { useEffect, useMemo, useRef } from 'react'
import { useTheme } from 'next-themes'
import createGlobe from 'cobe'

type SatelliteMarker = {
  id: string
  location: [number, number]
  size: number
}

const satelliteMarkers: SatelliteMarker[] = [
  { id: 'sat-1', location: [90.0, 0.0], size: 0.0004 },
  { id: 'sat-2', location: [61.9275, -137.5078], size: 0.0004 },
  { id: 'sat-3', location: [49.8808, 84.9845], size: 0.0004 },
  { id: 'sat-4', location: [40.3202, -52.5233], size: 0.0004 },
  { id: 'sat-5', location: [31.9657, 169.9689], size: 0.0004 },
  { id: 'sat-6', location: [24.3157, 32.4612], size: 0.0004 },
  { id: 'sat-7', location: [17.1046, -105.0466], size: 0.0004 },
  { id: 'sat-8', location: [10.1642, 117.4457], size: 0.0004 },
  { id: 'sat-9', location: [3.3723, -20.0621], size: 0.0004 },
  { id: 'sat-10', location: [-3.3723, -157.5699], size: 0.0004 },
  { id: 'sat-11', location: [-10.1642, 64.9224], size: 0.0004 },
  { id: 'sat-12', location: [-17.1046, -72.5854], size: 0.0004 },
  { id: 'sat-13', location: [-24.3157, 149.9068], size: 0.0004 },
  { id: 'sat-14', location: [-31.9657, 12.3991], size: 0.0004 },
  { id: 'sat-15', location: [-40.3202, -125.1087], size: 0.0004 },
  { id: 'sat-16', location: [-49.8808, 97.3835], size: 0.0004 },
  { id: 'sat-17', location: [-61.9275, -40.1242], size: 0.0004 },
  { id: 'sat-18', location: [-90.0, -180.0], size: 0.0004 },
]

export function AuthGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const labelStyles = useMemo(
    () =>
      satelliteMarkers.reduce<Record<string, React.CSSProperties>>((acc, marker) => {
        acc[marker.id] = {
          positionAnchor: `--cobe-${marker.id}` as never,
          opacity: `var(--cobe-visible-${marker.id}, 0)` as never,
          filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 8px))`,
        }
        return acc
      }, {}),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const themeConfig = isDark
      ? {
          dark: 0.92,
          diffuse: 1.05,
          mapBrightness: 3.6,
          mapBaseBrightness: 0.22,
          baseColor: [0.12, 0.15, 0.22] as [number, number, number],
          markerColor: [0.48, 0.62, 0.92] as [number, number, number],
          glowColor: [0.15, 0.24, 0.4] as [number, number, number],
        }
      : {
          dark: 0,
          diffuse: 1.2,
          mapBrightness: 6,
          mapBaseBrightness: 0,
          baseColor: [1, 1, 1] as [number, number, number],
          markerColor: [1, 1, 1] as [number, number, number],
          glowColor: [1, 1, 1] as [number, number, number],
        }

    let phi = 0
    let frameId = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const getSize = () => {
      const width = Math.max(1, Math.round(canvas.offsetWidth || 1))
      const height = Math.max(1, Math.round(canvas.offsetHeight || 1))
      return { width, height }
    }

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: getSize().width * dpr,
      height: getSize().height * dpr,
      phi: 0,
      theta: 0.24,
      dark: themeConfig.dark,
      diffuse: themeConfig.diffuse,
      mapSamples: 16000,
      mapBrightness: themeConfig.mapBrightness,
      mapBaseBrightness: themeConfig.mapBaseBrightness,
      baseColor: themeConfig.baseColor,
      markerColor: themeConfig.markerColor,
      glowColor: themeConfig.glowColor,
      markers: satelliteMarkers,
      markerElevation: 0.14,
      scale: 1,
      opacity: 1,
    })

    const pointerState = { active: false, x: 0, y: 0 }
    const dragOffset = { phi: 0, theta: 0 }
    const velocity = { phi: 0, theta: 0 }
    let phiOffset = 0
    let thetaOffset = 0
    let lastPointer: { x: number; y: number; t: number } | null = null

    const handlePointerDown = (event: PointerEvent) => {
      pointerState.active = true
      pointerState.x = event.clientX
      pointerState.y = event.clientY
      lastPointer = { x: event.clientX, y: event.clientY, t: Date.now() }
      canvas.style.cursor = 'grabbing'
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerState.active) return
      const deltaX = event.clientX - pointerState.x
      const deltaY = event.clientY - pointerState.y
      dragOffset.phi = deltaX / 300
      dragOffset.theta = deltaY / 1000

      const now = Date.now()
      if (lastPointer) {
        const dt = Math.max(now - lastPointer.t, 1)
        const maxVelocity = 0.15
        velocity.phi = Math.max(-maxVelocity, Math.min(maxVelocity, ((event.clientX - lastPointer.x) / dt) * 0.3))
        velocity.theta = Math.max(-maxVelocity, Math.min(maxVelocity, ((event.clientY - lastPointer.y) / dt) * 0.08))
      }
      lastPointer = { x: event.clientX, y: event.clientY, t: now }
    }

    const handlePointerUp = () => {
      if (pointerState.active) {
        phiOffset += dragOffset.phi
        thetaOffset += dragOffset.theta
        dragOffset.phi = 0
        dragOffset.theta = 0
      }
      pointerState.active = false
      lastPointer = null
      canvas.style.cursor = 'grab'
    }

    const animate = () => {
      if (!pointerState.active) {
        phi += 0.003
        if (Math.abs(velocity.phi) > 0.0001 || Math.abs(velocity.theta) > 0.0001) {
          phiOffset += velocity.phi
          thetaOffset += velocity.theta
          velocity.phi *= 0.95
          velocity.theta *= 0.95
        }
        const thetaMin = -0.45
        const thetaMax = 0.45
        if (thetaOffset < thetaMin) thetaOffset += (thetaMin - thetaOffset) * 0.1
        else if (thetaOffset > thetaMax) thetaOffset += (thetaMax - thetaOffset) * 0.1
      }

      const size = getSize()
      globe.update({
        width: size.width * dpr,
        height: size.height * dpr,
        phi: phi + phiOffset + dragOffset.phi,
        theta: 0.24 + thetaOffset + dragOffset.theta,
        markerElevation: 0.14,
        dark: themeConfig.dark,
        diffuse: themeConfig.diffuse,
        mapBrightness: themeConfig.mapBrightness,
        mapBaseBrightness: themeConfig.mapBaseBrightness,
        baseColor: themeConfig.baseColor,
        markerColor: themeConfig.markerColor,
        glowColor: themeConfig.glowColor,
      })
      frameId = window.requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(() => {
      const size = getSize()
      globe.update({ width: size.width * dpr, height: size.height * dpr })
    })

    canvas.style.cursor = 'grab'
    canvas.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    window.addEventListener('pointercancel', handlePointerUp, { passive: true })
    resizeObserver.observe(canvas)
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      resizeObserver.disconnect()
      globe.destroy()
    }
  }, [isDark])

  return (
    <div ref={wrapperRef} className='relative flex h-full min-h-[520px] items-center justify-center overflow-visible'>
      <style>{`
        .auth-globe-wrap::before {
          content: '';
          position: absolute;
          inset: 4% 8%;
          pointer-events: none;
          border-radius: 9999px;
          background: ${isDark
            ? 'radial-gradient(circle at center, rgba(62,82,122,0.42), rgba(36,48,78,0.22) 28%, rgba(18,24,38,0.08) 48%, rgba(0,0,0,0) 72%)'
            : 'radial-gradient(circle at center, rgba(255,255,255,0.95), rgba(236,242,255,0.58) 28%, rgba(162,189,255,0.12) 48%, rgba(0,0,0,0) 72%)'};
          filter: blur(28px);
          opacity: 0.96;
        }
        .auth-globe-wrap::after {
          content: '';
          position: absolute;
          inset: 10% 12%;
          pointer-events: none;
          border-radius: 9999px;
          background: ${isDark
            ? 'radial-gradient(circle at center, rgba(50,66,102,0.24), rgba(35,46,72,0.14) 32%, rgba(0,0,0,0) 60%)'
            : 'radial-gradient(circle at center, rgba(255,255,255,0.36), rgba(186,206,255,0.12) 32%, rgba(0,0,0,0) 60%)'};
          filter: blur(44px);
          opacity: 0.82;
        }
        .auth-globe-satellite {
          position: absolute;
          bottom: anchor(top);
          left: anchor(center);
          translate: -50% 0;
          margin-bottom: 4px;
          font-size: 30px;
          line-height: 1;
          pointer-events: none;
          transition: opacity 0.25s, filter 0.25s;
          z-index: 3;
          user-select: none;
        }
      `}</style>
      <div className='auth-globe-wrap absolute inset-0' />
      <div className='relative aspect-square h-full min-h-[520px] w-full -translate-y-6' style={{ transform: 'translateY(-1.5rem) scale(0.9)' }}>
        <canvas
          ref={canvasRef}
          className='block h-full w-full touch-none select-none opacity-100 [contain:layout_paint_size] [filter:brightness(1.02)_contrast(1.01)_saturate(0.9)_drop-shadow(0_16px_46px_rgba(148,163,184,0.18))]'
        />
        {satelliteMarkers.map((marker) => (
          <div key={marker.id} className='auth-globe-satellite' style={labelStyles[marker.id]}>
            🛰️
          </div>
        ))}
      </div>
    </div>
  )
}
