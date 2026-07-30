/** Tipo de contenido que puede tener una pestaña de una cuenta. */
export type TabKind = "markdown" | "sheet" | "files" | "news";

/** Una pestaña declarada dentro de una cuenta (Allbanks / Onebank). */
export interface AccountTab {
  /** Único dentro de su cuenta; se usa en ids compuestos ("<cuenta>:<pestaña>") y rutas de almacenamiento. */
  slug: string;
  /** Etiqueta de la pestaña y título de la tarjeta de contenido. */
  label: string;
  kind: TabKind;
}

export type AccountSlug = string;

/** Una cuenta (Allbanks, Onebank), con su propio listado independiente de pestañas. */
export interface Account {
  slug: AccountSlug;
  name: string;
  sector: string;
  /** Color de acento de la cuenta (hex). */
  accent: string;
  tabs: AccountTab[];
}

/** Una celda de la hoja de cálculo. */
export interface Cell {
  value: string;
  /** Color de fondo (hex) o "" para transparente. */
  bg: string;
  /** Color de texto (hex) o "" para el color por defecto. */
  color: string;
}

/** Una hoja de cálculo es una matriz de celdas (filas × columnas). */
export type Sheet = Cell[][];

/**
 * Documento completo de una hoja: las celdas + los tamaños de columnas y filas.
 * `colWidths[c]` = ancho en px de la columna c; `rowHeights[r]` = alto en px de la fila r.
 */
export interface SheetDoc {
  cells: Sheet;
  colWidths: number[];
  rowHeights: number[];
}

/** Una noticia del feed de Noticias de una cuenta. */
export interface NewsItem {
  id: string;
  /** Cuenta a la que pertenece esta noticia (Noticias es independiente por cuenta). */
  account_slug: string;
  title: string;
  body: string;
  /** Fuente/entidad, p. ej. "BBVA", "Santander". */
  source: string;
  /** Etiqueta opcional, p. ej. "normativa", "campaña". */
  tag: string;
  /** Si es la noticia destacada (se muestra grande arriba). */
  featured: boolean;
  /** ISO timestamp de creación. */
  created_at: string;
}

/** Un usuario autorizado de la app y su rol. */
export interface AppUser {
  email: string;
  /** Administrador: acceso completo (editar, gestionar usuarios). Si es false, solo lectura. */
  is_admin: boolean;
}
