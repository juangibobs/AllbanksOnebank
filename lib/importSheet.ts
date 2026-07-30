import type { Cell, Sheet, SheetDoc } from "./types";
import { makeDoc } from "./sheetData";

/**
 * Importación de hojas de cálculo — parseo 100% en el navegador.
 */

const HEADER_BG = "#334155";
const HEADER_COLOR = "#FFFFFF";

function cell(value: unknown, isHeader: boolean): Cell {
  return {
    value: value == null ? "" : String(value),
    bg: isHeader ? HEADER_BG : "",
    color: isHeader ? HEADER_COLOR : "",
  };
}

/** Convierte una matriz de valores en una hoja, con la 1ª fila como cabecera. */
function matrixToSheet(matrix: unknown[][]): Sheet {
  const rows = matrix.filter(
    (r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""),
  );
  return rows.map((row, r) => row.map((v) => cell(v, r === 0)));
}

/** Parser CSV robusto: soporta comillas, comas y saltos de línea dentro de celdas. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Quita BOM inicial si existe.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function jsonToMatrix(data: unknown): unknown[][] {
  if (Array.isArray(data) && data.length) {
    // Array de objetos -> cabecera con las claves + una fila por objeto.
    if (typeof data[0] === "object" && data[0] !== null && !Array.isArray(data[0])) {
      const keys = [
        ...new Set(data.flatMap((o) => Object.keys(o as Record<string, unknown>))),
      ];
      return [keys, ...data.map((o) => keys.map((k) => (o as Record<string, unknown>)[k] ?? ""))];
    }
    // Array de arrays -> ya es una matriz.
    if (Array.isArray(data[0])) return data as unknown[][];
  }
  throw new Error("Formato JSON no reconocido");
}

/**
 * Lee un archivo (.csv, .json, .xlsx, .xls) y devuelve un SheetDoc listo para el grid.
 * Lanza una excepción si el archivo no contiene datos.
 */
export async function importFileToSheet(file: File): Promise<SheetDoc> {
  const name = file.name.toLowerCase();
  let matrix: unknown[][];

  if (name.endsWith(".csv") || file.type === "text/csv") {
    matrix = parseCSV(await file.text());
  } else if (name.endsWith(".json") || file.type === "application/json") {
    matrix = jsonToMatrix(JSON.parse(await file.text()));
  } else {
    // .xlsx / .xls -> SheetJS. Import dinámico para no cargarlo salvo que haga falta.
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false }) as unknown[][];
  }

  const sheet = matrixToSheet(matrix);
  if (!sheet.length || !sheet[0]?.length) {
    throw new Error("No se encontraron datos en el archivo");
  }
  return makeDoc(sheet);
}
