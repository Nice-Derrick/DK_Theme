import { apiClient } from '@/lib/api/client'
import { appConfig } from '@/lib/config'
import type { ApiEnvelope, TrafficLog } from '@/lib/api/types'

type RawTrafficLog = {
  u?: number | string | null
  d?: number | string | null
  record_at?: number | string | null
  server_rate?: number | string | null
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeTrafficLog(item: RawTrafficLog): TrafficLog {
  const upload = toNumber(item.u)
  const download = toNumber(item.d)
  const recordAt = Math.floor(toNumber(item.record_at))
  const serverRate = toNumber(item.server_rate) || 1

  return {
    upload,
    download,
    total: upload + download,
    record_at: recordAt,
    server_rate: serverRate,
  }
}

function createMockTrafficLogs() {
  const dayCount = 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weights = [0.62, 0.74, 0.68, 0.91, 1.08, 1.16, 0.88, 0.79, 0.95, 1.03]

  return Array.from({ length: dayCount }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (dayCount - 1 - index))

    const weekday = day.getDay()
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.14 : 1
    const phase = 1 + ((index % 6) * 0.035)
    const weight = weights[index % weights.length] * weekendBoost * phase
    const download = Math.round(6.2 * 1024 * 1024 * 1024 * weight)
    const upload = Math.round(download * (0.22 + ((index % 4) * 0.03)))

    return {
      upload,
      download,
      total: upload + download,
      record_at: Math.floor(day.getTime() / 1000),
      server_rate: 1,
    } satisfies TrafficLog
  })
}

export async function getTrafficLogs() {
  if (appConfig.enableMock) return createMockTrafficLogs()
  const response = await apiClient.get<ApiEnvelope<RawTrafficLog[]>>('/api/v1/user/stat/getTrafficLog')
  const data = Array.isArray(response.data.data) ? response.data.data : []
  return data.map(normalizeTrafficLog).sort((a, b) => a.record_at - b.record_at)
}
