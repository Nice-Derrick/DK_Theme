declare module '@/vendor/cobe-legacy' {
  type GlobeMarker = {
    location: [number, number]
    size: number
  }

  type GlobeState = {
    phi?: number
    width?: number
    height?: number
    markers?: GlobeMarker[]
  }

  type GlobeOptions = Record<string, unknown> & {
    width?: number
    height?: number
    devicePixelRatio?: number
    phi?: number
    theta?: number
    markers?: GlobeMarker[]
    onRender?: (state: GlobeState) => void
  }

  type GlobeInstance = {
    update: (state?: Partial<GlobeOptions>) => GlobeInstance
    destroy: () => void
  }

  export default function createGlobe(canvas: HTMLCanvasElement, options: GlobeOptions): GlobeInstance
}
