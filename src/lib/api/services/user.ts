import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import { mockPlans, mockSubscribe, mockUser } from '@/lib/api/mock';
import type { ApiEnvelope, Plan, SubscribeInfo, UserInfo } from '@/lib/api/types';

type RawSubscribeInfo = Omit<SubscribeInfo, 'plan'> & {
  plan?: string | { name?: string | null } | null
}

function normalizeUserInfo(user: UserInfo): UserInfo {
  return user
}

function normalizeSubscribeInfo(subscribe: RawSubscribeInfo): SubscribeInfo {
  return {
    ...subscribe,
    plan: typeof subscribe.plan === 'string'
      ? subscribe.plan
      : subscribe.plan?.name ?? null,
  }
}

export async function getUserInfo() {
  if (appConfig.enableMock) return mockUser;
  const response = await apiClient.get<ApiEnvelope<UserInfo>>('/api/v1/user/info');
  return normalizeUserInfo(response.data.data);
}

export async function getSubscribeInfo() {
  if (appConfig.enableMock) return mockSubscribe;
  const response = await apiClient.get<ApiEnvelope<RawSubscribeInfo>>('/api/v1/user/getSubscribe');
  return normalizeSubscribeInfo(response.data.data);
}

export async function getPlans() {
  if (appConfig.enableMock) return mockPlans;
  const response = await apiClient.get<ApiEnvelope<Plan[]>>('/api/v1/user/plan/fetch');
  return response.data.data;
}
