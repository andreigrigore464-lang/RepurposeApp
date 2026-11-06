/**
 * Articles Database Queries
 * Query operations for inserting, finding, and listing ingested articles in Supabase.
 * Database Layer
 */

import { supabase } from "./client";

export interface ArticleRecord {
  id: string;
  brand_id: string;
  feed_id: string | null;
  canonical_url: string;
  content_hash: string;
  title: string;
  author: string | null;
  published_at: string | null;
  raw_html: string | null;
  clean_text: string;
  in_article_images: string[];
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function findArticleByUrlOrHash(params: {
  brandId: string;
  canonicalUrl: string;
  contentHash: string;
}): Promise<ArticleRecord | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("brand_id", params.brandId)
    .or(`canonical_url.eq.${params.canonicalUrl},content_hash.eq.${params.contentHash}`)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check existing article: ${error.message}`);
  }

  return data as ArticleRecord | null;
}

export async function insertArticle(params: {
  brandId: string;
  feedId?: string | null;
  canonicalUrl: string;
  contentHash: string;
  title: string;
  author?: string;
  publishedAt?: string;
  rawHtml?: string;
  cleanText: string;
  inArticleImages: string[];
}): Promise<ArticleRecord> {
  const { data, error } = await supabase
    .from("articles")
    .insert({
      brand_id: params.brandId,
      feed_id: params.feedId || null,
      canonical_url: params.canonicalUrl,
      content_hash: params.contentHash,
      title: params.title,
      author: params.author || null,
      published_at: params.publishedAt || null,
      raw_html: params.rawHtml || null,
      clean_text: params.cleanText,
      in_article_images: params.inArticleImages,
      status: "ingested",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert article "${params.canonicalUrl}": ${error.message}`);
  }

  return data as ArticleRecord;
}

export async function listArticlesForBrand(brandId: string, limit = 50): Promise<ArticleRecord[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list articles for brand "${brandId}": ${error.message}`);
  }

  return (data || []) as ArticleRecord[];
}

export async function getArticleById(articleId: string): Promise<ArticleRecord | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[db] Failed to fetch article "${articleId}":`, error.message);
    return null;
  }

  return data as ArticleRecord | null;
}

export async function deleteArticleById(articleId: string, brandId: string): Promise<boolean> {
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId)
    .eq("brand_id", brandId);

  if (error) {
    console.error(`[db] Failed to delete article "${articleId}":`, error.message);
    throw new Error(`Failed to delete article: ${error.message}`);
  }

  return true;
}

