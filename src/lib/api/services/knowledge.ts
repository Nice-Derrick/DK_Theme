import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/lib/config';
import { mockKnowledgeArticles, mockNotices } from '@/lib/api/mock';
import type { ApiEnvelope, KnowledgeArticle, Notice } from '@/lib/api/types';

type RawKnowledgeRecord = Record<string, unknown>
type RawKnowledgeData = RawKnowledgeRecord | RawKnowledgeRecord[] | Record<string, RawKnowledgeRecord[]>
type RawKnowledgeEnvelope = ApiEnvelope<RawKnowledgeData>
type RawNoticeEnvelope = ApiEnvelope<Notice[]> & { total?: number }

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function normalizeKnowledgeArticle(value: unknown): KnowledgeArticle | null {
  if (!value || typeof value !== 'object') return null

  const article = value as RawKnowledgeRecord
  const id = toNumber(article.id)
  const title = toStringValue(article.title)

  if (id == null || !title) return null

  return {
    id,
    title,
    body: toStringValue(article.body) ?? toStringValue(article.content) ?? undefined,
    updated_at: toNumber(article.updated_at) ?? toNumber(article.created_at) ?? undefined,
  }
}

function flattenKnowledgeData(data: RawKnowledgeEnvelope['data']): KnowledgeArticle[] {
  if (Array.isArray(data)) {
    return data.map(normalizeKnowledgeArticle).filter((item): item is KnowledgeArticle => item != null)
  }

  const single = normalizeKnowledgeArticle(data)
  if (single) return [single]

  if (data && typeof data === 'object') {
    return Object.values(data).flatMap((items) => Array.isArray(items)
      ? items.map(normalizeKnowledgeArticle).filter((item): item is KnowledgeArticle => item != null)
      : [])
  }

  return []
}

export async function getKnowledgeArticles() {
  if (appConfig.enableMock) return mockKnowledgeArticles;
  const response = await apiClient.get<RawKnowledgeEnvelope>('/api/v1/user/knowledge/fetch?language=zh-CN');
  return flattenKnowledgeData(response.data.data);
}

export async function getKnowledgeArticleDetail(id: number) {
  if (appConfig.enableMock) {
    const article = mockKnowledgeArticles.find((item) => item.id === id);
    if (!article) throw new Error('Knowledge article not found');
    return article;
  }
  const response = await apiClient.get<RawKnowledgeEnvelope>(`/api/v1/user/knowledge/fetch?language=zh-CN&id=${id}`);
  const article = flattenKnowledgeData(response.data.data).find((item) => item.id === id)
  if (!article) throw new Error('Knowledge article not found')
  return article
}

export async function getNotices() {
  if (appConfig.enableMock) return mockNotices;
  const response = await apiClient.get<RawNoticeEnvelope>('/api/v1/user/notice/fetch');
  return Array.isArray(response.data.data) ? response.data.data : [];
}
