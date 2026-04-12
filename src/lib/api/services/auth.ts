import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import { tokenStorage } from '@/lib/storage';
import { mockSubscribe, mockUser } from '@/lib/api/mock';
import type { ApiEnvelope, AuthPayload } from '@/lib/api/types';

export const loginSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少 6 位'),
});

export const registerSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  email_code: z.string().min(4, '请输入邮箱验证码'),
  password: z.string().min(6, '密码至少 6 位'),
  confirmPassword: z.string().min(6, '请再次输入密码'),
  invite_code: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  email_code: z.string().min(4, '请输入邮箱验证码'),
  password: z.string().min(6, '密码至少 6 位'),
  confirmPassword: z.string().min(6, '请再次输入密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export async function login(values: LoginInput) {
  if (appConfig.enableMock) {
    const fakeToken = `demo-token-${values.email}`;
    tokenStorage.set(fakeToken);
    return {
      auth_data: fakeToken,
      user: mockUser,
      subscribe: mockSubscribe,
    };
  }

  const response = await apiClient.post<ApiEnvelope<AuthPayload>>('/api/v1/passport/auth/login', values);
  const token = response.data.data.auth_data;
  tokenStorage.set(token);
  return response.data.data;
}

export async function sendRegisterEmailVerify(email: string) {
  if (appConfig.enableMock) {
    return { message: '验证码已发送到你的邮箱（演示环境）' };
  }

  const response = await apiClient.post<ApiEnvelope<null>>('/api/v1/passport/comm/sendEmailVerify', { email });
  return response.data;
}

export async function sendForgotPasswordEmailVerify(email: string) {
  return sendRegisterEmailVerify(email);
}

export async function register(values: RegisterInput) {
  const payload = {
    email: values.email,
    email_code: values.email_code,
    password: values.password,
    invite_code: values.invite_code?.trim() || undefined,
  };

  if (appConfig.enableMock) {
    const fakeToken = `demo-token-${values.email}`;
    tokenStorage.set(fakeToken);
    return {
      auth_data: fakeToken,
      user: mockUser,
      subscribe: mockSubscribe,
    };
  }

  const response = await apiClient.post<ApiEnvelope<AuthPayload>>('/api/v1/passport/auth/register', payload);
  const token = response.data.data.auth_data;
  tokenStorage.set(token);
  return response.data.data;
}

export async function resetForgotPassword(values: ForgotPasswordInput) {
  const payload = {
    email: values.email,
    email_code: values.email_code,
    password: values.password,
  };

  if (appConfig.enableMock) {
    return { message: '密码已重置（演示环境）' };
  }

  const candidates = [
    '/api/v1/passport/auth/forget',
    '/api/v1/passport/auth/reset',
    '/api/v1/passport/auth/forgetPassword',
  ];

  let lastError: unknown;
  for (const endpoint of candidates) {
    try {
      const response = await apiClient.post<ApiEnvelope<null>>(endpoint, payload);
      return response.data;
    } catch (error) {
      lastError = error;
      const status = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
      if (status && status !== 404) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('重置密码接口不可用');
}

export async function logout() {
  tokenStorage.clear();
}
