import axios from 'axios';
import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import { mockInvite } from '@/lib/api/mock';
import type { ApiEnvelope, InviteStat } from '@/lib/api/types';

type RawInviteCode = {
  code: string
  status: boolean | number
  created_at: number
}

type RawInviteFetchData = {
  codes?: RawInviteCode[]
  stat?: [number?, number?, number?, number?, number?]
}

type ApiStatus = string | number | undefined

type InviteSaveResult = boolean | RawInviteCode | null | undefined

type ApiFailureEnvelope = {
  message?: string
  data?: unknown
  status?: string | number
  error?: string | null
}

function isApiSuccess(status: ApiStatus) {
  if (status == null) return true
  if (typeof status === 'number') return status === 1 || status === 200
  const normalized = status.toLowerCase()
  return normalized === 'success' || normalized === 'ok'
}

function getApiErrorMessage<T>(response: ApiEnvelope<T>, fallback: string) {
  if (!isApiSuccess(response.status)) {
    return response.message || fallback
  }
  return null
}

function getAxiosErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiFailureEnvelope>(error)) {
    const apiMessage = error.response?.data?.message || error.response?.data?.error
    if (apiMessage) return apiMessage
    if (error.response?.status) return `${fallback}（HTTP ${error.response.status}）`
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function normalizeInviteCode(item: RawInviteCode) {
  return {
    code: item.code,
    status: typeof item.status === 'boolean' ? (item.status ? 1 : 0) : Number(item.status ?? 0),
    created_at: Number(item.created_at ?? 0),
  }
}

function sortInviteCodes<T extends { created_at: number }>(codes: T[]) {
  return [...codes].sort((a, b) => b.created_at - a.created_at)
}

function normalizeInviteStat(data: RawInviteFetchData): InviteStat {
  const rawStat = Array.isArray(data.stat) ? data.stat : []
  return {
    codes: sortInviteCodes((data.codes ?? []).map(normalizeInviteCode)),
    stat: {
      invite_count: Number(rawStat[0] ?? 0),
      commission_balance: Number(rawStat[1] ?? 0),
      commission_pending: Number(rawStat[2] ?? 0),
    },
  }
}

async function requestInviteCode(method: 'get' | 'post') {
  if (method === 'get') {
    return apiClient.get<ApiEnvelope<InviteSaveResult>>('/api/v1/user/invite/save')
  }
  return apiClient.post<ApiEnvelope<InviteSaveResult>>('/api/v1/user/invite/save', {})
}

function normalizeInviteSaveResponse(response: ApiEnvelope<InviteSaveResult>) {
  const errorMessage = getApiErrorMessage(response, '生成邀请码失败')
  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const payload = response.data
  if (payload == null || payload === false) {
    throw new Error(response.message || '生成邀请码失败')
  }

  if (typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string') {
    return normalizeInviteCode(payload)
  }

  return { success: true }
}

export async function getInviteStat() {
  if (appConfig.enableMock) return mockInvite;
  const response = await apiClient.get<ApiEnvelope<RawInviteFetchData>>('/api/v1/user/invite/fetch');
  const errorMessage = getApiErrorMessage(response.data, '获取邀请码信息失败')
  if (errorMessage) {
    throw new Error(errorMessage)
  }
  return normalizeInviteStat(response.data.data ?? {});
}

export async function generateInviteCode() {
  if (appConfig.enableMock) return { success: true }

  try {
    const response = await requestInviteCode('get')
    return normalizeInviteSaveResponse(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && [400, 404, 405].includes(error.response?.status ?? 0)) {
      try {
        const fallbackResponse = await requestInviteCode('post')
        return normalizeInviteSaveResponse(fallbackResponse.data)
      } catch (fallbackError) {
        throw new Error(getAxiosErrorMessage(fallbackError, '生成邀请码失败'))
      }
    }

    throw new Error(getAxiosErrorMessage(error, '生成邀请码失败'))
  }
}
