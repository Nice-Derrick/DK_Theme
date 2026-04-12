import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import type { ApiEnvelope } from '@/lib/api/types';

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
  new_password_2: string;
};

export type UpdateReminderPayload = {
  remind_expire: 0 | 1;
  remind_traffic: 0 | 1;
};

export async function changePassword(payload: ChangePasswordPayload) {
  if (appConfig.enableMock) {
    return { success: true, payload };
  }
  const response = await apiClient.post<ApiEnvelope<unknown>>('/api/v1/user/changePassword', payload);
  return response.data.data;
}

export async function updateReminderSettings(payload: UpdateReminderPayload) {
  if (appConfig.enableMock) {
    return { success: true, payload };
  }
  const response = await apiClient.post<ApiEnvelope<unknown>>('/api/v1/user/update', payload);
  return response.data.data;
}

export async function resetSubscribeSecurity() {
  if (appConfig.enableMock) {
    return { success: true };
  }
  const response = await apiClient.get<ApiEnvelope<unknown>>('/api/v1/user/resetSecurity');
  return response.data.data;
}
