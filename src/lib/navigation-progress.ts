const listeners = new Set<() => void>()
let navigationSignal = 0

export function startNavigationProgress() {
  navigationSignal += 1
  listeners.forEach((listener) => listener())
}

export function subscribeNavigationProgress(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getNavigationProgressSignal() {
  return navigationSignal
}
