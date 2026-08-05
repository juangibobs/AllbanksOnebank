import type { Account, AccountSlug, AccountTab, TabKind } from "./types";
import { getSupabase } from "./supabase/client";

/**
 * Cuentas y sus pestañas.
 *
 * Ya no están fijas en el código: viven en la tabla `ao_accounts` y un
 * administrador las crea, renombra, reordena y borra desde la propia web
 * (ver supabase/estructura.sql). La lista de abajo es solo la SEMILLA: se
 * inserta tal cual la primera vez que se arranca con la tabla vacía, de modo
 * que la app se ve exactamente igual que antes, y sirve de respaldo si no hay
 * Supabase configurado.
 */
export const SEED_ACCOUNTS: Account[] = [
  {
    slug: "allbanks",
    name: "Allbanks",
    sector: "Banca",
    accent: "#64748B",
    tabs: [
      { slug: "noticias", label: "Noticias", kind: "news" },
      { slug: "documentacion", label: "Documentación requerida", kind: "sheet" },
      { slug: "compromisos", label: "Compromisos", kind: "files" },
      { slug: "otros-documentos", label: "Otros documentos", kind: "files" },
      { slug: "manuales", label: "Manuales", kind: "files" },
      { slug: "links", label: "Links relevantes", kind: "markdown" },
    ],
  },
  {
    slug: "onebank",
    name: "Onebank",
    sector: "Banca",
    accent: "#334155",
    tabs: [
      { slug: "documentacion", label: "Documentación requerida", kind: "sheet" },
      { slug: "consentimientos", label: "Consentimientos", kind: "files" },
      { slug: "noticias", label: "Noticias", kind: "news" },
      { slug: "links", label: "Links relevantes", kind: "markdown" },
      { slug: "otros-documentos", label: "Otros documentos", kind: "files" },
      { slug: "politicas-sabadell", label: "Políticas Sabadell", kind: "files" },
      { slug: "operaciones-ropo", label: "Operaciones ropo", kind: "files" },
      { slug: "manuales", label: "Manuales", kind: "files" },
    ],
  },
];

const TABLE = "ao_accounts";
const CONTENT_TABLE = "ao_account_tabs";
const LS_KEY = "ao_accounts_structure";

/** Tipos de pestaña que un administrador puede crear desde la interfaz. */
export const CREATABLE_KINDS: { kind: TabKind; label: string; help: string }[] = [
  { kind: "markdown", label: "Texto", help: "Texto con formato: títulos, listas, enlaces y tablas." },
  { kind: "sheet", label: "Excel", help: "Hoja de cálculo editable, como Documentación requerida." },
  { kind: "files", label: "Documentos", help: "Biblioteca de archivos: PDF, Word, PowerPoint, Excel e imágenes." },
  { kind: "news", label: "Noticias", help: "Feed de noticias con titulares y lectura a pantalla completa." },
];

export function kindLabel(kind: TabKind): string {
  return CREATABLE_KINDS.find((k) => k.kind === kind)?.label ?? kind;
}

// ---------------------------------------------------------------------------
// Utilidades de slug
// ---------------------------------------------------------------------------

/** Convierte un nombre en un slug ("Políticas Sabadell" -> "politicas-sabadell"). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Slug libre a partir de un nombre, añadiendo sufijo si ya está cogido. */
export function uniqueSlug(name: string, taken: string[], fallback = "nueva"): string {
  const base = slugify(name) || fallback;
  if (!taken.includes(base)) return base;
  for (let i = 2; i < 200; i++) {
    if (!taken.includes(`${base}-${i}`)) return `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

interface AccountRow {
  slug: string;
  name: string;
  sector: string;
  accent: string;
  position: number;
  tabs: AccountTab[];
}

function fromRow(r: AccountRow): Account {
  return {
    slug: r.slug,
    name: r.name,
    sector: r.sector ?? "",
    accent: r.accent ?? "#64748B",
    tabs: Array.isArray(r.tabs) ? r.tabs : [],
  };
}

function readLocal(): Account[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : null;
  } catch {
    return null;
  }
}

function writeLocal(accounts: Account[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(accounts));
  } catch {
    /* ignore */
  }
}

/**
 * Carga la estructura. Si la tabla está vacía, siembra las cuentas iniciales
 * para que la app se vea igual que antes de que existiera esta tabla.
 */
export async function loadAccounts(): Promise<Account[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from(TABLE).select("*").order("position");
    if (error) return SEED_ACCOUNTS;
    const rows = (data ?? []) as AccountRow[];
    if (rows.length > 0) return rows.map(fromRow);

    // Primera vez: sembrar.
    await sb.from(TABLE).insert(
      SEED_ACCOUNTS.map((a, i) => ({
        slug: a.slug,
        name: a.name,
        sector: a.sector,
        accent: a.accent,
        position: i,
        tabs: a.tabs,
      })),
    );
    return SEED_ACCOUNTS;
  }
  return readLocal() ?? SEED_ACCOUNTS;
}

export function getAccount(accounts: Account[], slug: AccountSlug): Account {
  return accounts.find((a) => a.slug === slug) ?? accounts[0];
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/** Crea o actualiza una cuenta (incluidas sus pestañas). */
export async function saveAccount(account: Account, position: number, all: Account[]): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).upsert({
      slug: account.slug,
      name: account.name,
      sector: account.sector,
      accent: account.accent,
      position,
      tabs: account.tabs,
    });
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(all);
}

/** Borra una cuenta y el contenido guardado de sus pestañas. */
export async function deleteAccount(slug: string, all: Account[]): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).delete().eq("slug", slug);
    if (error) throw new Error(error.message);
    // El contenido de sus pestañas deja de ser accesible: se borra también.
    await sb.from(CONTENT_TABLE).delete().eq("account_slug", slug);
    return;
  }
  writeLocal(all.filter((a) => a.slug !== slug));
}

/** Borra el contenido guardado de una pestaña concreta. */
export async function deleteTabContent(account: string, tab: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from(CONTENT_TABLE).delete().eq("id", `${account}:${tab}`);
}

/** Reescribe el orden de todas las cuentas. */
export async function saveOrder(accounts: Account[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    writeLocal(accounts);
    return;
  }
  await Promise.all(
    accounts.map((a, i) => sb.from(TABLE).update({ position: i }).eq("slug", a.slug)),
  );
}
