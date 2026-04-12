import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import { mockTicketDetails, mockTickets } from '@/lib/api/mock';
import type { ApiEnvelope, Ticket, TicketDetail } from '@/lib/api/types';

export type CreateTicketPayload = {
  subject: string;
  level: string | number;
  message: string;
};

export async function getTickets() {
  if (appConfig.enableMock) return mockTickets;
  const response = await apiClient.get<ApiEnvelope<Ticket[]>>('/api/v1/user/ticket/fetch');
  return response.data.data;
}

export async function getTicketDetail(id: number) {
  if (appConfig.enableMock) {
    const detail = mockTicketDetails[id];
    if (!detail) throw new Error('Ticket not found');
    return detail;
  }
  const response = await apiClient.get<ApiEnvelope<TicketDetail>>(`/api/v1/user/ticket/fetch?id=${id}`);
  return response.data.data;
}

export async function createTicket(payload: CreateTicketPayload) {
  if (appConfig.enableMock) {
    return { success: true, payload };
  }
  const response = await apiClient.post<ApiEnvelope<unknown>>('/api/v1/user/ticket/save', payload);
  return response.data.data;
}

export async function closeTicket(id: number) {
  if (appConfig.enableMock) {
    return { success: true, id };
  }
  const response = await apiClient.post<ApiEnvelope<unknown>>('/api/v1/user/ticket/close', { id });
  return response.data.data;
}

export async function replyTicket(id: number, message: string) {
  if (appConfig.enableMock) {
    return { success: true, id, message };
  }
  const response = await apiClient.post<ApiEnvelope<unknown>>('/api/v1/user/ticket/reply', { id, message });
  return response.data.data;
}
