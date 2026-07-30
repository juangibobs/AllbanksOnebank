import type { NewsItem } from "./types";
import { getSupabase } from "./supabase/client";

const NEWS_TABLE = "ao_news";
const LS_NEWS = (account: string) => `ao_news_${account}`;

export interface NewNewsInput {
  title: string;
  body: string;
  source: string;
  tag: string;
  featured: boolean;
}

export async function loadNews(account: string): Promise<NewsItem[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(NEWS_TABLE)
      .select("id,account_slug,title,body,source,tag,featured,created_at")
      .eq("account_slug", account)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as NewsItem[];
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_NEWS(account));
      if (raw) {
        const arr = JSON.parse(raw) as NewsItem[];
        return arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

export async function addNews(account: string, input: NewNewsInput): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(NEWS_TABLE).insert({
      account_slug: account,
      title: input.title,
      body: input.body,
      source: input.source,
      tag: input.tag || null,
      featured: input.featured,
    });
    if (error) throw new Error(error.message);
    return;
  }
  try {
    const raw = localStorage.getItem(LS_NEWS(account));
    const arr: NewsItem[] = raw ? JSON.parse(raw) : [];
    arr.unshift({
      id: crypto.randomUUID(),
      account_slug: account,
      title: input.title,
      body: input.body,
      source: input.source,
      tag: input.tag,
      featured: input.featured,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(LS_NEWS(account), JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export async function updateNews(account: string, id: string, input: NewNewsInput): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb
      .from(NEWS_TABLE)
      .update({
        title: input.title,
        body: input.body,
        source: input.source,
        tag: input.tag || null,
        featured: input.featured,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  try {
    const raw = localStorage.getItem(LS_NEWS(account));
    const arr: NewsItem[] = raw ? JSON.parse(raw) : [];
    const i = arr.findIndex((n) => n.id === id);
    if (i !== -1) arr[i] = { ...arr[i], ...input };
    localStorage.setItem(LS_NEWS(account), JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export async function deleteNews(account: string, id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(NEWS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  try {
    const raw = localStorage.getItem(LS_NEWS(account));
    const arr: NewsItem[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LS_NEWS(account), JSON.stringify(arr.filter((n) => n.id !== id)));
  } catch {
    /* ignore */
  }
}

/** Formatea una fecha ISO como "28 jul 2026". */
export function formatNewsDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
