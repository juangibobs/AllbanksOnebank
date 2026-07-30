import type { Cell, Sheet, SheetDoc } from "./types";

/** Tamaños por defecto (px). */
export const DEFAULT_COL_WIDTH = 200;
export const DEFAULT_ROW_HEIGHT = 44;
export const MIN_COL_WIDTH = 60;
export const MIN_ROW_HEIGHT = 28;

/** Crea una celda vacía. */
export const emptyCell = (): Cell => ({ value: "", bg: "", color: "" });

/** Convierte una matriz de strings en una hoja de celdas. */
export function toSheet(matrix: (string | number | null | undefined)[][]): Sheet {
  return matrix.map((row) =>
    row.map((v) => ({ value: v == null ? "" : String(v), bg: "", color: "" })),
  );
}

/** Número de columnas de una hoja (fila más larga). */
export function sheetCols(cells: Sheet): number {
  return cells.reduce((m, r) => Math.max(m, r.length), 0);
}

/** Construye un SheetDoc a partir de celdas, con tamaños por defecto (o los dados). */
export function makeDoc(
  cells: Sheet,
  colWidths?: number[],
  rowHeights?: number[],
): SheetDoc {
  const cols = sheetCols(cells);
  return {
    cells,
    colWidths: normalizeSizes(colWidths, cols, DEFAULT_COL_WIDTH),
    rowHeights: normalizeSizes(rowHeights, cells.length, DEFAULT_ROW_HEIGHT),
  };
}

/** Ajusta un array de tamaños a la longitud deseada, rellenando con el valor por defecto. */
export function normalizeSizes(sizes: number[] | undefined, len: number, def: number): number[] {
  const out = (sizes ?? []).slice(0, len);
  while (out.length < len) out.push(def);
  return out;
}

/** Copia profunda de una hoja (para no mutar la semilla). */
export function cloneSheet(sheet: Sheet): Sheet {
  return sheet.map((row) => row.map((c) => ({ ...c })));
}

const EMPTY_SHEET: Sheet = toSheet([
  ["Documento", "Obligatorio", "Notas"],
  ["", "", ""],
]);

/** SheetDoc de partida para una pestaña nueva (sin contenido semilla todavía). */
export function emptyDoc(): SheetDoc {
  return makeDoc(cloneSheet(EMPTY_SHEET));
}
