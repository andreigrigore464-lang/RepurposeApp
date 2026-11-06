/**
 * Repurpose Studio Shared Types
 * Type definitions for ad-hoc article and video repurposing flows.
 * System Layer: ui / repurpose
 */

export interface ArticlePreview {
  title: string;
  author: string;
  publishedAt: string;
  canonicalUrl: string;
  wordCount: number;
  excerpt: string;
  inArticleImages: string[];
}

export interface VideoProgressState {
  jobId: string;
  articleId: string;
  status: string;
  progressPct: number;
  stageMessage: string;
  errorMessage: string | null;
  formats: Array<{
    id: string;
    formatKind: string;
    status: string;
    slotsData: Record<string, unknown> | null;
  }>;
}

export interface ManualTimestamp {
  start: string;
  end: string;
}

