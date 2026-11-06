/**
 * Inbox Database Queries
 * Combines articles, digests, and generated format outputs for the editorial workbench inbox.
 * System Layer: db
 */

import { supabase } from "./client";

export interface InboxFormatBadge {
  id: string;
  formatKind: string;
  status: string;
}

export interface InboxArticleItem {
  id: string;
  title: string;
  canonicalUrl: string;
  publishedAt: string | null;
  createdAt: string;
  status: string;
  digestItemsCount: number;
  formats: InboxFormatBadge[];
}

export async function getInboxArticlesForBrand(brandId: string): Promise<InboxArticleItem[]> {
  const { data: articles, error: articlesErr } = await supabase
    .from("articles")
    .select("id, title, canonical_url, published_at, created_at, status")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (articlesErr || !articles) {
    console.error("[db] Failed to fetch articles for inbox:", articlesErr?.message);
    return [];
  }

  const articleIds = articles.map((a) => a.id);
  if (articleIds.length === 0) return [];

  // Fetch all completed digests for these articles
  const { data: digests } = await supabase
    .from("digests")
    .select("article_id, items, status")
    .in("article_id", articleIds)
    .eq("status", "completed");

  // Fetch all format outputs for these articles
  const { data: formatOutputs } = await supabase
    .from("format_outputs")
    .select("id, article_id, format_kind, status")
    .in("article_id", articleIds)
    .order("created_at", { ascending: true });

  const digestMap = new Map<string, number>();
  for (const d of digests || []) {
    digestMap.set(d.article_id, Array.isArray(d.items) ? d.items.length : 0);
  }

  const formatMap = new Map<string, InboxFormatBadge[]>();
  for (const f of formatOutputs || []) {
    const list = formatMap.get(f.article_id) || [];
    list.push({
      id: f.id,
      formatKind: f.format_kind,
      status: f.status,
    });
    formatMap.set(f.article_id, list);
  }

  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    canonicalUrl: a.canonical_url,
    publishedAt: a.published_at,
    createdAt: a.created_at,
    status: a.status,
    digestItemsCount: digestMap.get(a.id) || 0,
    formats: formatMap.get(a.id) || [],
  }));
}

