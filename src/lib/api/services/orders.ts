import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import { mockOrderDetails, mockOrders, mockPaymentMethods } from '@/lib/api/mock';
import type { ApiEnvelope, Order, OrderDetail, PaymentMethod } from '@/lib/api/types';

export type CancelOrderPayload = {
  trade_no: string;
};

export type CheckoutOrderPayload = {
  trade_no: string;
  method: number;
};

export type CheckoutOrderResponse = string | {
  type?: number;
  data?: string;
  url?: string;
}

export type CreateOrderPayload = {
  period: string;
  plan_id: number;
  coupon_code?: string;
}

function normalizeCheckoutUrl(payload: CheckoutOrderResponse) {
  if (typeof payload === 'string') return payload
  if (payload && typeof payload === 'object') {
    if (typeof payload.data === 'string') return payload.data
    if (typeof payload.url === 'string') return payload.url
  }
  return ''
}

export async function getOrders() {
  if (appConfig.enableMock) return mockOrders;
  const response = await apiClient.get<ApiEnvelope<Order[]>>('/api/v1/user/order/fetch');
  return response.data.data;
}

export async function getOrderDetail(tradeNo: string) {
  if (appConfig.enableMock) {
    const detail = mockOrderDetails[tradeNo];
    if (!detail) throw new Error('Order not found');
    return detail;
  }
  const response = await apiClient.get<ApiEnvelope<OrderDetail>>(`/api/v1/user/order/detail?trade_no=${encodeURIComponent(tradeNo)}`);
  return response.data.data;
}

export async function getPaymentMethods() {
  if (appConfig.enableMock) return mockPaymentMethods;
  const response = await apiClient.get<ApiEnvelope<PaymentMethod[]>>('/api/v1/user/order/getPaymentMethod');
  return response.data.data;
}

export async function cancelOrder(payload: CancelOrderPayload) {
  if (appConfig.enableMock) {
    return { success: true, payload };
  }
  const response = await apiClient.post<ApiEnvelope<unknown>>('/api/v1/user/order/cancel', payload);
  return response.data.data;
}

export async function checkoutOrder(payload: CheckoutOrderPayload) {
  if (appConfig.enableMock) {
    return 'https://example.com/mock-checkout';
  }
  const response = await apiClient.post<ApiEnvelope<CheckoutOrderResponse>>('/api/v1/user/order/checkout', payload);
  return normalizeCheckoutUrl(response.data.data);
}

export async function createOrder(payload: CreateOrderPayload) {
  if (appConfig.enableMock) {
    return mockOrders[0]?.trade_no ?? 'mock-trade-no'
  }
  const response = await apiClient.post<ApiEnvelope<string>>('/api/v1/user/order/save', payload)
  return response.data.data
}
