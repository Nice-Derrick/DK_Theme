import { apiClient } from '@/lib/api/client'
import { mockNodeStatuses } from '@/lib/api/mock'
import { appConfig } from '@/lib/config'
import type { ApiEnvelope, NodeStatus } from '@/lib/api/types'

type RawNodeStatus = Record<string, unknown>

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeNodeStatus(item: RawNodeStatus, index: number): NodeStatus {
  const name =
    toStringValue(item.name) ??
    toStringValue(item.server_name) ??
    toStringValue(item.show) ??
    toStringValue(item.host) ??
    `节点 ${index + 1}`

  const statusValue = item.online ?? item.is_online ?? item.available ?? item.status
  const online = typeof statusValue === 'boolean'
    ? statusValue
    : typeof statusValue === 'number'
      ? statusValue === 1 || statusValue === 200
      : typeof statusValue === 'string'
        ? ['1', 'true', 'online', 'available', 'ok', 'healthy'].includes(statusValue.toLowerCase())
        : true

  const latency =
    toNumber(item.latency) ??
    toNumber(item.ping) ??
    toNumber(item.avg_ping) ??
    toNumber(item.delay)

  const load =
    toNumber(item.load) ??
    toNumber(item.cpu_load) ??
    toNumber(item.utilization)

  const loss =
    toNumber(item.loss) ??
    toNumber(item.packet_loss)

  const lastChecked =
    toNumber(item.last_checked) ??
    toNumber(item.lastCheckAt) ??
    toNumber(item.updated_at) ??
    Math.floor(Date.now() / 1000)

  const tags = Array.isArray(item.tags)
    ? item.tags.map((entry) => toStringValue(entry)).filter(Boolean) as string[]
    : []

  return {
    id: toStringValue(item.id) ?? toNumber(item.id) ?? index + 1,
    name,
    location: toStringValue(item.location) ?? toStringValue(item.area) ?? toStringValue(item.country),
    group: toStringValue(item.group) ?? toStringValue(item.group_name) ?? toStringValue(item.type),
    network: toStringValue(item.network) ?? toStringValue(item.line) ?? toStringValue(item.route),
    tags,
    rate: toNumber(item.rate),
    online,
    latency,
    load,
    loss,
    last_checked: lastChecked,
    remarks: toStringValue(item.remarks) ?? toStringValue(item.description),
  }
}

export async function getNodeStatuses() {
  if (appConfig.enableMock) return mockNodeStatuses
  const response = await apiClient.get<ApiEnvelope<RawNodeStatus[]>>(appConfig.nodeStatus.apiPath)
  const data = Array.isArray(response.data.data) ? response.data.data : []
  return data.map((item, index) => normalizeNodeStatus(item, index))
}
