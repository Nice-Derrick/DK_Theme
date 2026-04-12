export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  status?: string | number;
};

export type AuthPayload = {
  auth_data: string;
};

export type UserInfo = {
  email: string;
  balance: number;
  commission_balance?: number;
  avatar_url?: string | null;
  plan?: string | null;
  expired_at?: number | null;
  transfer_enable?: number;
  d?: number;
  remind_expire?: number | boolean;
  remind_traffic?: number | boolean;
};

export type SubscribeInfo = {
  subscribe_url: string;
  token?: string;
  transfer_enable?: number;
  d?: number;
  expired_at?: number | null;
  plan?: string | null;
};

export type Plan = {
  id: number;
  name: string;
  content?: string | null;
  transfer_enable?: number | null;
  month_price?: number | null;
  quarter_price?: number | null;
  half_year_price?: number | null;
  year_price?: number | null;
  two_year_price?: number | null;
  three_year_price?: number | null;
  onetime_price?: number | null;
  reset_price?: number | null;
};

export type OrderPlan = {
  id: number;
  name: string;
  transfer_enable: number;
  month_price?: number | null;
  quarter_price?: number | null;
  half_year_price?: number | null;
  year_price?: number | null;
  onetime_price?: number | null;
  reset_price?: number | null;
};

export type Order = {
  trade_no: string;
  total_amount: number;
  status: number;
  period: string;
  created_at: number;
  plan: OrderPlan;
};

export type OrderDetail = {
  trade_no: string;
  status: number;
  period: string;
  created_at: number;
  plan: OrderPlan;
  total_amount: number;
  balance_amount: number;
  discount_amount: number;
  handling_amount: number;
};

export type PaymentMethod = {
  id: number;
  name: string;
  icon: string;
};

export type KnowledgeArticle = {
  id: number;
  title: string;
  body?: string;
  updated_at?: number;
};

export type Notice = {
  id: number;
  title: string;
  content: string;
  created_at?: number;
};

export type Ticket = {
  id: number;
  subject: string;
  status: number;
  level: number;
  reply_status: number;
  created_at: number;
  updated_at: number;
};

export type TicketMessage = {
  id?: number;
  message: string;
  created_at: number;
  is_me: boolean;
};

export type TicketDetail = {
  id: number;
  subject: string;
  status: number;
  level: number;
  reply_status: number;
  created_at: number;
  updated_at: number;
  message: TicketMessage[];
};

export type InviteStat = {
  codes: Array<{ code: string; status: number; created_at: number }>;
  stat: {
    commission_balance: number;
    commission_pending: number;
    invite_count: number;
  };
};

export type NodeStatus = {
  id: number | string;
  name: string;
  location?: string | null;
  group?: string | null;
  network?: string | null;
  tags?: string[];
  rate?: number | null;
  online: boolean;
  latency?: number | null;
  load?: number | null;
  loss?: number | null;
  last_checked?: number | null;
  remarks?: string | null;
};

export type TrafficLog = {
  upload: number;
  download: number;
  total: number;
  record_at: number;
  server_rate: number;
};
