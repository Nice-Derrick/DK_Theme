import type { InviteStat, KnowledgeArticle, NodeStatus, Notice, Order, OrderDetail, PaymentMethod, Plan, SubscribeInfo, Ticket, TicketDetail, UserInfo } from './types';

export const mockUser: UserInfo = {
  email: 'demo@dk-theme.local',
  balance: 128,
  commission_balance: 36,
  plan: 'Global Pro 年付版',
  expired_at: 1806537600,
  transfer_enable: 600 * 1024 * 1024 * 1024,
  d: 204 * 1024 * 1024 * 1024,
  remind_expire: 1,
  remind_traffic: 1,
};

export const mockSubscribe: SubscribeInfo = {
  subscribe_url: 'https://example.com/sub/demo-token',
  token: 'demo-token',
  transfer_enable: mockUser.transfer_enable,
  d: mockUser.d,
  expired_at: mockUser.expired_at,
  plan: mockUser.plan,
};

export const mockPlans: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    transfer_enable: 160 * 1024 * 1024 * 1024,
    month_price: 2500,
    quarter_price: 6800,
    half_year_price: 12800,
    year_price: 25000,
    content: '适合个人日常使用与轻量访问。',
  },
  {
    id: 2,
    name: 'Global Pro',
    transfer_enable: 600 * 1024 * 1024 * 1024,
    month_price: 4900,
    quarter_price: 13800,
    half_year_price: 25800,
    year_price: 49000,
    content: '覆盖办公、流媒体与多设备场景。',
  },
  {
    id: 3,
    name: 'Unlimited Max',
    transfer_enable: 2 * 1024 * 1024 * 1024 * 1024,
    month_price: 9600,
    quarter_price: 27600,
    half_year_price: 52800,
    year_price: 96000,
    content: '适合高频使用与重度用户。',
  },
  {
    id: 4,
    name: '流量加油包 100G',
    transfer_enable: 100 * 1024 * 1024 * 1024,
    onetime_price: 900,
    content: '一次性补充流量，适合轻量加量与临时应急。',
  },
  {
    id: 5,
    name: '流量加油包 200G',
    transfer_enable: 200 * 1024 * 1024 * 1024,
    onetime_price: 1500,
    content: '一次性补充流量，适合临时加量与短期使用。',
  },
  {
    id: 6,
    name: '流量加油包 500G',
    transfer_enable: 500 * 1024 * 1024 * 1024,
    onetime_price: 3200,
    content: '一次性补充更多流量，适合高频使用前的快速扩容。',
  },
  {
    id: 7,
    name: '流量重置包',
    transfer_enable: 600 * 1024 * 1024 * 1024,
    reset_price: 1200,
    content: '将当前套餐流量重置到完整额度，适合周期内快速恢复可用流量。',
  },
];

export const mockOrders: Order[] = [
  {
    trade_no: 'TB202604100001',
    total_amount: 49000,
    status: 0,
    period: 'year_price',
    created_at: 1712731200,
    plan: { id: 2, name: 'Global Pro', transfer_enable: 600, year_price: 49000, month_price: 4900 },
  },
  {
    trade_no: 'TB202604080017',
    total_amount: 2500,
    status: 3,
    period: 'month_price',
    created_at: 1712558400,
    plan: { id: 1, name: 'Starter', transfer_enable: 160, month_price: 2500 },
  },
  {
    trade_no: 'TB202604060003',
    total_amount: 9600,
    status: 2,
    period: 'month_price',
    created_at: 1712385600,
    plan: { id: 3, name: 'Unlimited Max', transfer_enable: 2048, month_price: 9600 },
  },
];

export const mockOrderDetails: Record<string, OrderDetail> = {
  TB202604100001: {
    trade_no: 'TB202604100001',
    status: 0,
    period: 'year_price',
    created_at: 1712731200,
    plan: { id: 2, name: 'Global Pro', transfer_enable: 600, year_price: 49000, month_price: 4900 },
    total_amount: 49000,
    balance_amount: 0,
    discount_amount: 0,
    handling_amount: 0,
  },
  TB202604080017: {
    trade_no: 'TB202604080017',
    status: 3,
    period: 'month_price',
    created_at: 1712558400,
    plan: { id: 1, name: 'Starter', transfer_enable: 160, month_price: 2500 },
    total_amount: 2500,
    balance_amount: 0,
    discount_amount: 0,
    handling_amount: 0,
  },
  TB202604060003: {
    trade_no: 'TB202604060003',
    status: 2,
    period: 'month_price',
    created_at: 1712385600,
    plan: { id: 3, name: 'Unlimited Max', transfer_enable: 2048, month_price: 9600 },
    total_amount: 9600,
    balance_amount: 0,
    discount_amount: 0,
    handling_amount: 0,
  },
};

export const mockPaymentMethods: PaymentMethod[] = [
  { id: 1, name: '支付宝', icon: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/alipay/default.svg' },
  { id: 2, name: '微信支付', icon: 'https://raw.githubusercontent.com/elestyle/elepay-payment-logos/refs/heads/master/payment_logos/svg/wechatpay.svg' },
  { id: 3, name: '余额支付', icon: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/cash-app/default.svg' },
];

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  { id: 1, title: '首次使用：3 分钟完成客户端配置', body: '第一步：进入客户端下载页，选择适合你设备的客户端。\n第二步：复制订阅链接或使用一键导入。\n第三步：导入完成后更新订阅并选择节点即可。', updated_at: 1712731200 },
  { id: 2, title: '订阅无法更新时的排查步骤', body: '请先检查网络连接、订阅地址是否失效、客户端是否开启必要权限。若仍失败，可尝试重新导入订阅或提交工单。', updated_at: 1712698920 },
  { id: 3, title: '多设备登录与安全使用规范', body: '请勿共享账号；如怀疑订阅泄露，可前往设置页重置订阅信息。建议同时开启到期邮件提醒与流量邮件提醒。', updated_at: 1712613600 },
];

export const mockNotices: Notice[] = [
  { id: 1, title: '支付后未立即开通', content: '支付完成后通常会在数秒到数分钟内开通，可前往订单页查看状态。', created_at: 1712731200 },
  { id: 2, title: '客户端下载建议', content: 'Windows 推荐 Clash Meta 或 v2rayN；iOS 推荐 Stash / Shadowrocket；Android 推荐 NekoBox。', created_at: 1712698920 },
];

export const mockTickets: Ticket[] = [
  { id: 2048, subject: 'Windows 客户端订阅更新延迟', status: 0, level: 1, reply_status: 1, created_at: 1712700000, updated_at: 1712731200 },
  { id: 2039, subject: '请求补开发票信息', status: 0, level: 0, reply_status: 0, created_at: 1712650000, updated_at: 1712698920 },
  { id: 2026, subject: 'Apple Silicon 设备导入说明咨询', status: 1, level: 0, reply_status: 0, created_at: 1712580000, updated_at: 1712613600 },
];

export const mockTicketDetails: Record<number, TicketDetail> = {
  2048: {
    id: 2048,
    subject: 'Windows 客户端订阅更新延迟',
    status: 0,
    level: 1,
    reply_status: 1,
    created_at: 1712700000,
    updated_at: 1712731200,
    message: [
      { id: 1, message: 'Windows 客户端订阅更新有明显延迟，想确认是否是缓存导致。', created_at: 1712700000, is_me: true },
      { id: 2, message: '我们已收到反馈，正在协助检查订阅刷新链路。', created_at: 1712710800, is_me: false },
    ],
  },
  2039: {
    id: 2039,
    subject: '请求补开发票信息',
    status: 0,
    level: 0,
    reply_status: 0,
    created_at: 1712650000,
    updated_at: 1712698920,
    message: [
      { id: 1, message: '你好，我想补开上月订单发票，抬头与税号如下。', created_at: 1712650000, is_me: true },
      { id: 2, message: '好的，请补充邮箱地址，我们处理后会发送给你。', created_at: 1712698920, is_me: false },
    ],
  },
  2026: {
    id: 2026,
    subject: 'Apple Silicon 设备导入说明咨询',
    status: 1,
    level: 0,
    reply_status: 0,
    created_at: 1712580000,
    updated_at: 1712613600,
    message: [
      { id: 1, message: '请问 Apple Silicon 设备推荐使用哪个客户端导入？', created_at: 1712580000, is_me: true },
      { id: 2, message: '建议使用 Clash Verge Rev 或 Stash，导入方式已发送给你。', created_at: 1712613600, is_me: false },
    ],
  },
};

export const mockInvite: InviteStat = {
  codes: [
    { code: 'INVITE-PLUS', status: 0, created_at: 1712500000 },
    { code: 'INVITE-GIFT', status: 1, created_at: 1712000000 },
  ],
  stat: {
    commission_balance: 36,
    commission_pending: 12,
    invite_count: 8,
  },
};

export const mockNodeStatuses: NodeStatus[] = [
  { id: 170, name: 'Pacific Stream 01', location: '美国 · 洛杉矶', group: 'vless', network: 'BGP', tags: ['Netflix', 'YouTube', 'Disney+'], rate: 0.5, online: true, last_checked: 1775885103 },
  { id: 178, name: 'Silicon Valley AI 02', location: '美国 · 圣何塞', group: 'vless', network: 'Premium', tags: ['ChatGPT', 'Claude', 'Gemini'], rate: 1, online: true, last_checked: 1775885159 },
  { id: 181, name: 'Broadway Max 03', location: '美国 · 纽约', group: 'trojan', network: 'IEPL', tags: ['Netflix', 'HBO Max', 'TikTok'], rate: 2, online: true, last_checked: 1775885139 },
  { id: 11, name: 'Victoria Harbour 01', location: '中国香港 · 九龙', group: 'shadowsocks', network: 'IEPL', tags: ['低延迟', 'ChatGPT', 'YouTube'], rate: 1, online: true, last_checked: 1775885118 },
  { id: 13, name: 'Central Exchange 02', location: '中国香港 · 中环', group: 'shadowsocks', network: 'BGP', tags: ['Netflix', 'Disney+', '稳定'], rate: 1, online: true, last_checked: 1775885116 },
  { id: 14, name: 'Harbour Express 03', location: '中国香港 · 将军澳', group: 'vmess', network: 'CMI', tags: ['YouTube', '4K', '低倍率'], rate: 0.8, online: true, last_checked: 1775885115 },
  { id: 140, name: 'Peak Reserve 04', location: '中国香港 · 荃湾', group: 'trojan', network: 'Premium', tags: ['Claude', 'GitHub', '办公'], rate: 1.5, online: false, last_checked: 1775885018 },
  { id: 119, name: 'Marina Bay AI 01', location: '新加坡 · 滨海湾', group: 'shadowsocks', network: 'IEPL', tags: ['ChatGPT', 'Claude', 'Gemini'], rate: 1, online: true, last_checked: 1775885112 },
  { id: 120, name: 'Jurong Edge 02', location: '新加坡 · 裕廊', group: 'vless', network: 'BGP', tags: ['Netflix', 'YouTube', 'Prime Video'], rate: 1, online: true, last_checked: 1775885110 },
  { id: 166, name: 'Orchard Media 03', location: '新加坡 · 乌节路', group: 'trojan', network: 'Premium', tags: ['Disney+', 'Spotify', 'TikTok'], rate: 1.2, online: true, last_checked: 1775885109 },
  { id: 167, name: 'Sentosa Reserve 04', location: '新加坡 · 圣淘沙', group: 'hysteria2', network: 'Premium', tags: ['游戏', '低延迟', 'YouTube'], rate: 1.5, online: false, last_checked: 1775885002 },
  { id: 6, name: 'Tokyo Sakura 01', location: '日本 · 东京', group: 'shadowsocks', network: 'IEPL', tags: ['Netflix', 'Disney+', 'Abema'], rate: 1, online: true, last_checked: 1775885127 },
  { id: 9, name: 'Osaka Umeda 02', location: '日本 · 大阪', group: 'vless', network: 'BGP', tags: ['ChatGPT', 'Claude', 'GitHub'], rate: 1, online: true, last_checked: 1775885125 },
  { id: 15, name: 'Nagoya Core 03', location: '日本 · 名古屋', group: 'trojan', network: 'Premium', tags: ['YouTube', '稳定', '4K'], rate: 1.2, online: true, last_checked: 1775885122 },
  { id: 8, name: 'Fukuoka Stream 04', location: '日本 · 福冈', group: 'vmess', network: 'CMI', tags: ['Netflix', 'Niconico', '低倍率'], rate: 0.8, online: true, last_checked: 1775885119 },
  { id: 59, name: 'Seoul Pulse 01', location: '韩国 · 首尔', group: 'shadowsocks', network: 'BGP', tags: ['YouTube', 'Wavve', '低延迟'], rate: 1, online: true, last_checked: 1775885156 },
  { id: 60, name: 'Taipei Breeze 02', location: '中国台湾 · 台北', group: 'trojan', network: 'Premium', tags: ['ChatGPT', 'YouTube', '稳定'], rate: 1, online: true, last_checked: 1775885153 },
  { id: 142, name: 'London Thames 01', location: '英国 · 伦敦', group: 'vless', network: 'IEPL', tags: ['Netflix', 'BBC iPlayer', 'Claude'], rate: 1.5, online: true, last_checked: 1775885151 },
  { id: 153, name: 'Frankfurt Core 01', location: '德国 · 法兰克福', group: 'wireguard', network: 'BGP', tags: ['GitHub', '办公', '低延迟'], rate: 1.3, online: true, last_checked: 1775885149 },
];
