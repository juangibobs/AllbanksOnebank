import type { Sheet, SheetDoc } from "./types";
import { makeDoc, emptyDoc } from "./sheetData";
import { getSupabase } from "./supabase/client";

/**
 * Capa de persistencia para el contenido de las pestañas de tipo "sheet"/"markdown".
 *
 * - Si Supabase está configurado (variables NEXT_PUBLIC_SUPABASE_*), lee y
 *   escribe en la tabla `ao_account_tabs` (proyecto compartido con Protágoras,
 *   prefijo "ao_" para no chocar con sus tablas).
 * - Si no, usa `localStorage` (para desarrollo sin backend).
 * - En ambos casos, si no hay dato guardado se devuelve un contenido/hoja vacíos.
 */

const TABLE = "ao_account_tabs";

const rowId = (account: string, tab: string) => `${account}:${tab}`;
const LS_SHEET = (account: string, tab: string) => `ao_sheet_${account}_${tab}`;
const LS_CONTENT = (account: string, tab: string) => `ao_content_${account}_${tab}`;

// ---- Hojas de cálculo ----

export async function loadSheet(account: string, tab: string): Promise<SheetDoc> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(TABLE)
      .select("sheet")
      .eq("id", rowId(account, tab))
      .maybeSingle();
    if (!error && data?.sheet) {
      const s = data.sheet as {
        cells: Sheet;
        colWidths?: number[];
        rowHeights?: number[];
        stickyRows?: number[];
        stickyCols?: number[];
      };
      return makeDoc(s.cells, s.colWidths, s.rowHeights, s.stickyRows, s.stickyCols);
    }
    return emptyDoc();
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_SHEET(account, tab));
      if (raw) {
        const parsed = JSON.parse(raw);
        return makeDoc(parsed.cells as Sheet, parsed.colWidths, parsed.rowHeights, parsed.stickyRows, parsed.stickyCols);
      }
    } catch {
      /* ignore */
    }
  }
  return emptyDoc();
}

export async function saveSheet(account: string, tab: string, doc: SheetDoc): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).upsert({
      id: rowId(account, tab),
      account_slug: account,
      tab_slug: tab,
      sheet: doc,
    });
    if (error) throw new Error(error.message);
    return;
  }
  try {
    localStorage.setItem(LS_SHEET(account, tab), JSON.stringify(doc));
  } catch {
    /* ignore */
  }
}

// ---- Contenido Markdown ----

export async function loadContent(account: string, tab: string): Promise<string> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(TABLE)
      .select("content")
      .eq("id", rowId(account, tab))
      .maybeSingle();
    if (!error && data?.content != null) return data.content as string;
    return "";
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_CONTENT(account, tab));
      if (raw != null) return raw;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export async function saveContent(account: string, tab: string, content: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).upsert({
      id: rowId(account, tab),
      account_slug: account,
      tab_slug: tab,
      content,
    });
    if (error) throw new Error(error.message);
    return;
  }
  try {
    localStorage.setItem(LS_CONTENT(account, tab), content);
  } catch {
    /* ignore */
  }
}
