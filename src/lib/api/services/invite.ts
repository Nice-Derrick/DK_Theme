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

type RawCommissionRecord = {
  id?: string | number
  trade_no?: string
  title?: string
  type?: string | number
  status?: string | number | boolean
  amount?: number
  get_amount?: number
  created_at?: number
  updated_at?: number
}

type RawInviteFetchData = {
  codes?: RawInviteCode[]
  stat?: [number?, number?, number?, number?, number?]
  records?: RawCommissionRecord[]
  commission_logs?: RawCommissionRecord[]
  commission_log?: RawCommissionRecord[]
}

type ApiStatus = string | number | undefined

type InviteSaveResult = boolean | RawInviteCode | null | undefined

type ApiFailureEnvelope = {
  message?: string
  data?: unknown
  status?: string | number
  error?: string | null
}

type CommConfigPayload = {
  withdraw_methods?: string[]
  withdraw_close?: number | boolean
  currency?: string
  currency_symbol?: string
}

export type WithdrawCommissionInput = {
  method: string
  account: string
}

export type TransferCommissionInput = {
  amount: number
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

function assertApiSuccess<T>(response: ApiEnvelope<T>, fallback: string) {
  const errorMessage = getApiErrorMessage(response, fallback)
  if (errorMessage) {
    throw new Error(errorMessage)
  }
  return response.data
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

function normalizeRecordStatus(status: RawCommissionRecord['status']) {
  if (status === true || status === 1 || status === '1' || status === 'success' || status === 'paid') return 'success' as const
  return 'pending' as const
}

function normalizeRecordType(type: RawCommissionRecord['type']) {
  if (type === 'withdraw' || type === 1 || type === '1') return 'withdraw' as const
  if (type === 'transfer' || type === 2 || type === '2') return 'transfer' as const
  return 'commission' as const
}

function normalizeCommissionRecord(item: RawCommissionRecord, index: number) {
  const type = normalizeRecordType(item.type)
  const amount = Number(item.get_amount ?? item.amount ?? 0)
  const createdAt = Number(item.created_at ?? item.updated_at ?? 0)
  const id = item.id ?? item.trade_no ?? `${type}-${createdAt || index}`

  return {
    id: String(id),
    title: item.title || (item.trade_no ? `订单 ${item.trade_no} 返佣` : '推广佣金记录'),
    amount,
    created_at: createdAt,
    type,
    status: normalizeRecordStatus(item.status),
  }
}

function sortInviteCodes<T extends { created_at: number }>(codes: T[]) {
  return [...codes].sort((a, b) => b.created_at - a.created_at)
}

function sortRecords<T extends { created_at: number }>(records: T[]) {
  return [...records].sort((a, b) => b.created_at - a.created_at)
}

function normalizeInviteStat(data: RawInviteFetchData): InviteStat {
  const rawStat = Array.isArray(data.stat) ? data.stat : []
  const rawRecords = data.records ?? data.commission_logs ?? data.commission_log ?? []

  return {
    codes: sortInviteCodes((data.codes ?? []).map(normalizeInviteCode)),
    stat: {
      invite_count: Number(rawStat[0] ?? 0),
      commission_balance: Number(rawStat[1] ?? 0),
      commission_pending: Number(rawStat[2] ?? 0),
    },
    records: sortRecords(rawRecords.map(normalizeCommissionRecord)),
  }
}

async function requestInviteCode(method: 'get' | 'post') {
  if (method === 'get') {
    return apiClient.get<ApiEnvelope<InviteSaveResult>>('/api/v1/user/invite/save')
  }
  return apiClient.post<ApiEnvelope<InviteSaveResult>>('/api/v1/user/invite/save', {})
}

function normalizeInviteSaveResponse(response: ApiEnvelope<InviteSaveResult>) {
  assertApiSuccess(response, '生成邀请码失败')

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
  const payload = assertApiSuccess(response.data, '获取邀请码信息失败')
  return normalizeInviteStat(payload ?? {});
}

export async function getCommissionConfig() {
  if (appConfig.enableMock) {
    return { withdraw_methods: ['alipay', 'usdt', 'paypal'], withdraw_close: 0 }
  }

  try {
    const response = await apiClient.get<ApiEnvelope<CommConfigPayload>>('/api/v1/user/comm/config')
    return assertApiSuccess(response.data, '获取佣金配置失败') ?? {}
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, '获取佣金配置失败'))
  }
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

export async function withdrawCommission(input: WithdrawCommissionInput) {
  if (appConfig.enableMock) return { success: true }

  try {
    const response = await apiClient.post<ApiEnvelope<boolean>>('/api/v1/user/ticket/withdraw', {
      withdraw_method: input.method,
      withdraw_account: input.account,
    })
    const payload = assertApiSuccess(response.data, '提交提现申请失败')
    if (payload === false) throw new Error(response.data.message || '提交提现申请失败')
    return { success: true }
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, '提交提现申请失败'))
  }
}

export async function transferCommission(input: TransferCommissionInput) {
  if (appConfig.enableMock) return { success: true }

  try {
    const response = await apiClient.post<ApiEnvelope<boolean>>('/api/v1/user/transfer', {
      transfer_amount: input.amount,
    })
    const payload = assertApiSuccess(response.data, '佣金划转失败')
    if (payload === false) throw new Error(response.data.message || '佣金划转失败')
    return { success: true }
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, '佣金划转失败'))
  }
}
