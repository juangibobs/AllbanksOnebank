"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Upload, Loader2, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import type { Cell, SheetDoc } from "@/lib/types";
import {
  emptyCell,
  sheetCols,
  normalizeSizes,
  removeStickyIndex,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
} from "@/lib/sheetData";
import { importFileToSheet } from "@/lib/importSheet";

const ROW_NUM_WIDTH = 44;

const BG_PALETTE = [
  { label: "Blanco", value: "" },
  { label: "Rojo", value: "#FECACA" },
  { label: "Naranja", value: "#FED7AA" },
  { label: "Amarillo", value: "#FEF08A" },
  { label: "Verde", value: "#BBF7D0" },
  { label: "Teal", value: "#99F6E4" },
  { label: "Cian", value: "#A5F3FC" },
  { label: "Azul", value: "#BFDBFE" },
  { label: "Índigo", value: "#C7D2FE" },
  { label: "Morado", value: "#E9D5FF" },
  { label: "Rosa", value: "#FBCFE8" },
  { label: "Gris", value: "#E5E7EB" },
  { label: "Negro", value: "#94A3B8" },
];

const TEXT_PALETTE = [
  { label: "Negro", value: "#111827" },
  { label: "Blanco", value: "#FFFFFF" },
  { label: "Rojo", value: "#DC2626" },
  { label: "Naranja", value: "#EA580C" },
  { label: "Verde", value: "#16A34A" },
  { label: "Azul", value: "#2563EB" },
  { label: "Morado", value: "#7C3AED" },
  { label: "Gris", value: "#6B7280" },
];

/** Índice de columna -> letra (0 -> A, 25 -> Z, 26 -> AA...). */
function colLetter(n: number): string {
  let s = "";
  let x = n;
  do {
    s = String.fromCharCode(65 + (x % 26)) + s;
    x = Math.floor(x / 26) - 1;
  } while (x >= 0);
  return s;
}

interface Props {
  doc: SheetDoc;
  editMode: boolean;
  onChange: (doc: SheetDoc) => void;
}

type Resize = { kind: "col" | "row"; index: number; startPos: number; startSize: number };

const key = (r: number, c: number) => `${r},${c}`;

export default function SpreadsheetView({ doc, editMode, onChange }: Props) {
  // Selección múltiple: conjunto de celdas "r,c" + ancla para rangos con Shift.
  const [selected, setSelected] = useState<Set<string>>(() => new Set([key(1, 0)]));
  const [anchor, setAnchor] = useState<{ r: number; c: number }>({ r: 1, c: 0 });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cells = doc.cells;
  const cols = useMemo(() => sheetCols(cells), [cells]);
  const colWidths = useMemo(
    () => normalizeSizes(doc.colWidths, cols, DEFAULT_COL_WIDTH),
    [doc.colWidths, cols],
  );
  const rowHeights = useMemo(
    () => normalizeSizes(doc.rowHeights, cells.length, DEFAULT_ROW_HEIGHT),
    [doc.rowHeights, cells.length],
  );
  const stickyRows = useMemo(() => doc.stickyRows ?? [], [doc.stickyRows]);
  const stickyCols = useMemo(() => doc.stickyCols ?? [], [doc.stickyCols]);
  const stickyRowSet = useMemo(() => new Set(stickyRows), [stickyRows]);
  const stickyColSet = useMemo(() => new Set(stickyCols), [stickyCols]);

  // Desplazamiento acumulado (top/left en px) de cada fila/columna fija, para apilarlas sin solaparse.
  const rowTop = useMemo(() => {
    const m = new Map<number, number>();
    let acc = 0;
    for (const r of [...stickyRows].sort((a, b) => a - b)) {
      m.set(r, acc);
      acc += rowHeights[r] ?? DEFAULT_ROW_HEIGHT;
    }
    return m;
  }, [stickyRows, rowHeights]);
  const colLeft = useMemo(() => {
    const m = new Map<number, number>();
    let acc = ROW_NUM_WIDTH;
    for (const c of [...stickyCols].sort((a, b) => a - b)) {
      m.set(c, acc);
      acc += colWidths[c] ?? DEFAULT_COL_WIDTH;
    }
    return m;
  }, [stickyCols, colWidths]);

  const toggleStickyRow = (r: number) => {
    onChange({
      ...doc,
      stickyRows: stickyRowSet.has(r) ? stickyRows.filter((x) => x !== r) : [...stickyRows, r],
    });
  };
  const toggleStickyCol = (c: number) => {
    onChange({
      ...doc,
      stickyCols: stickyColSet.has(c) ? stickyCols.filter((x) => x !== c) : [...stickyCols, c],
    });
  };

  // ---- Redimensionado (arrastrar bordes) ----
  const resizing = useRef<Resize | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizing.current;
      if (!r) return;
      const d = docRef.current;
      if (r.kind === "col") {
        const widths = normalizeSizes(d.colWidths, sheetCols(d.cells), DEFAULT_COL_WIDTH).slice();
        widths[r.index] = Math.max(MIN_COL_WIDTH, Math.round(r.startSize + (e.clientX - r.startPos)));
        onChange({ ...d, colWidths: widths });
      } else {
        const heights = normalizeSizes(d.rowHeights, d.cells.length, DEFAULT_ROW_HEIGHT).slice();
        heights[r.index] = Math.max(MIN_ROW_HEIGHT, Math.round(r.startSize + (e.clientY - r.startPos)));
        onChange({ ...d, rowHeights: heights });
      }
    };
    const onUp = () => {
      if (resizing.current) {
        resizing.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onChange]);

  const startResize = (kind: "col" | "row", index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = {
      kind,
      index,
      startPos: kind === "col" ? e.clientX : e.clientY,
      startSize: kind === "col" ? colWidths[index] : rowHeights[index],
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = kind === "col" ? "col-resize" : "row-resize";
  };

  // ---- Edición de celdas / filas / columnas ----
  const patchCell = (r: number, c: number, patch: Partial<Cell>) => {
    onChange({
      ...doc,
      cells: cells.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? { ...cell, ...patch } : cell)) : row,
      ),
    });
  };

  // Aplica un cambio de estilo a TODAS las celdas seleccionadas (colorear varias a la vez).
  const applyToSelection = (patch: Partial<Cell>) => {
    onChange({
      ...doc,
      cells: cells.map((row, ri) => row.map((cell, ci) => (selected.has(key(ri, ci)) ? { ...cell, ...patch } : cell))),
    });
  };

  // Selección de celdas: clic normal (una), Shift (rango), Ctrl/⌘ (alternar).
  const selectCell = (r: number, c: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      const r1 = Math.min(anchor.r, r), r2 = Math.max(anchor.r, r);
      const c1 = Math.min(anchor.c, c), c2 = Math.max(anchor.c, c);
      const next = new Set<string>();
      for (let rr = r1; rr <= r2; rr++) for (let cc = c1; cc <= c2; cc++) next.add(key(rr, cc));
      setSelected(next);
    } else if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const next = new Set(selected);
      if (next.has(key(r, c))) next.delete(key(r, c));
      else next.add(key(r, c));
      setSelected(next);
      setAnchor({ r, c });
    } else {
      setSelected(new Set([key(r, c)]));
      setAnchor({ r, c });
    }
  };

  const addRow = () =>
    onChange({
      ...doc,
      cells: [...cells, Array.from({ length: cols }, emptyCell)],
      rowHeights: [...rowHeights, DEFAULT_ROW_HEIGHT],
    });

  const addCol = () =>
    onChange({
      ...doc,
      cells: cells.map((row) => [...row, emptyCell()]),
      colWidths: [...colWidths, DEFAULT_COL_WIDTH],
    });

  const removeRow = () => {
    if (cells.length <= 2) return;
    onChange({
      ...doc,
      cells: cells.filter((_, ri) => ri !== anchor.r),
      rowHeights: rowHeights.filter((_, ri) => ri !== anchor.r),
      stickyRows: removeStickyIndex(stickyRows, anchor.r),
    });
    const r = Math.max(1, anchor.r - 1);
    setAnchor({ r, c: anchor.c });
    setSelected(new Set([key(r, anchor.c)]));
  };

  const removeCol = () => {
    if (cols <= 1) return;
    onChange({
      ...doc,
      cells: cells.map((row) => row.filter((_, ci) => ci !== anchor.c)),
      colWidths: colWidths.filter((_, ci) => ci !== anchor.c),
      stickyCols: removeStickyIndex(stickyCols, anchor.c),
    });
    const c = Math.max(0, anchor.c - 1);
    setAnchor({ r: anchor.r, c });
    setSelected(new Set([key(anchor.r, c)]));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      const imported = await importFileToSheet(file);
      onChange(imported);
      setAnchor({ r: 1, c: 0 });
      setSelected(new Set([key(1, 0)]));
      toast.success("Hoja importada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const activeStyle = cells[anchor.r]?.[anchor.c];
  const tableWidth = ROW_NUM_WIDTH + colWidths.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full">
      {editMode && (
        <div className="flex flex-wrap items-center gap-4 mb-3 p-3 rounded-xl border border-brand-blue/15 bg-brand-cyan-50">
          <div className="flex items-center gap-1.5">
            <ToolButton onClick={addRow} solid>
              <Plus className="w-3.5 h-3.5" /> Fila
            </ToolButton>
            <ToolButton onClick={addCol} solid>
              <Plus className="w-3.5 h-3.5" /> Col
            </ToolButton>
            <ToolButton onClick={removeRow}>
              <Minus className="w-3.5 h-3.5" /> Fila
            </ToolButton>
            <ToolButton onClick={removeCol}>
              <Minus className="w-3.5 h-3.5" /> Col
            </ToolButton>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-cyan text-white hover:bg-brand-cyan-dark transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {loading ? "Importando…" : "Importar"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={handleImport}
          />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-brand-blue">Fondo</span>
            <div className="flex items-center gap-1">
              {BG_PALETTE.map((x) => (
                <button
                  key={x.label}
                  type="button"
                  title={x.label}
                  onClick={() => applyToSelection({ bg: x.value })}
                  className={`w-5 h-5 rounded-md border ${
                    activeStyle?.bg === x.value ? "ring-2 ring-brand-cyan border-brand-blue" : "border-brand-blue/20"
                  }`}
                  style={{ background: x.value || "#ffffff" }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-brand-blue">Texto</span>
            <div className="flex items-center gap-1">
              {TEXT_PALETTE.map((x) => (
                <button
                  key={x.label}
                  type="button"
                  title={x.label}
                  onClick={() => applyToSelection({ color: x.value })}
                  className={`w-5 h-5 rounded-md border ${
                    activeStyle?.color === x.value ? "ring-2 ring-brand-cyan border-brand-blue" : "border-brand-blue/20"
                  }`}
                  style={{ background: x.value }}
                />
              ))}
            </div>
          </div>

          <span className="text-[11px] text-brand-blue/60">
            Selección múltiple: Mayús+clic (rango) · Ctrl/⌘+clic (varias sueltas), y aplica un color a todas. Arrastra los bordes para redimensionar.
            Pulsa el icono de chincheta junto al número de fila o la letra de columna para fijarla (sticky) al hacer scroll, o vuelve a pulsarlo para quitarla.
          </span>
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-brand-blue/15 bg-white">
        <table className="border-collapse" style={{ tableLayout: "fixed", width: tableWidth }}>
          <colgroup>
            <col style={{ width: ROW_NUM_WIDTH }} />
            {Array.from({ length: cols }).map((_, c) => (
              <col key={c} style={{ width: colWidths[c] }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="bg-brand-blue text-white text-xs font-semibold border border-brand-blue sticky left-0 z-20">
                #
              </th>
              {Array.from({ length: cols }).map((_, c) => {
                const colSticky = stickyColSet.has(c);
                return (
                  <th
                    key={c}
                    className={`relative bg-brand-blue text-white text-xs font-semibold px-3 py-2 border border-brand-blue text-left select-none ${
                      colSticky ? "sticky z-[15]" : ""
                    }`}
                    style={colSticky ? { left: colLeft.get(c) } : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {colLetter(c)}
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => toggleStickyCol(c)}
                          title={colSticky ? "Quitar columna fija" : "Fijar columna (sticky)"}
                          className="opacity-70 hover:opacity-100"
                        >
                          {colSticky ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                        </button>
                      )}
                    </span>
                    {editMode && (
                      <span
                        onMouseDown={startResize("col", c)}
                        title="Arrastrar para ajustar el ancho"
                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-white/40"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, r) => {
              const rowSticky = stickyRowSet.has(r);
              return (
              <tr key={r} style={{ height: rowHeights[r] }}>
                <td
                  className="relative bg-brand-cyan-50 text-brand-blue/60 text-xs font-medium px-2 border border-brand-blue/15 text-center sticky left-0 z-20 select-none"
                  style={{ height: rowHeights[r], top: rowSticky ? rowTop.get(r) : undefined }}
                >
                  <span className="inline-flex items-center gap-1">
                    {r + 1}
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => toggleStickyRow(r)}
                        title={rowSticky ? "Quitar fila fija" : "Fijar fila (sticky)"}
                        className="opacity-70 hover:opacity-100"
                      >
                        {rowSticky ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                  {editMode && (
                    <span
                      onMouseDown={startResize("row", r)}
                      title="Arrastrar para ajustar el alto"
                      className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize hover:bg-brand-blue/20"
                    />
                  )}
                </td>
                {Array.from({ length: cols }).map((_, c) => {
                  const cell = row[c] ?? emptyCell();
                  const isSel = editMode && selected.has(key(r, c));
                  const colSticky = stickyColSet.has(c);
                  const cellSticky = colSticky || rowSticky;
                  const cellStyle: React.CSSProperties = {
                    background: cell.bg || (cellSticky ? "#ffffff" : undefined),
                    height: rowHeights[r],
                  };
                  if (colSticky) cellStyle.left = colLeft.get(c);
                  if (rowSticky) cellStyle.top = rowTop.get(r);
                  const zClass = colSticky && rowSticky ? "z-[15]" : cellSticky ? "z-[6]" : "";
                  return (
                    <td
                      key={c}
                      onMouseDown={(e) => editMode && selectCell(r, c, e)}
                      className={`border border-brand-blue/15 align-top p-0 ${
                        isSel ? "ring-2 ring-inset ring-brand-cyan" : ""
                      } ${cellSticky ? `sticky ${zClass}` : ""}`}
                      style={cellStyle}
                    >
                      {editMode ? (
                        <input
                          value={cell.value}
                          onChange={(e) => patchCell(r, c, { value: e.target.value })}
                          onFocus={() => {
                            setSelected(new Set([key(r, c)]));
                            setAnchor({ r, c });
                          }}
                          className="w-full h-full bg-transparent px-3 py-2 text-sm outline-none"
                          style={{ color: cell.color || "#0F172A" }}
                        />
                      ) : (
                        <div
                          className="px-3 py-2 text-sm whitespace-pre-wrap h-full"
                          style={{ color: cell.color || "#0F172A" }}
                        >
                          {cell.value}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToolButton({
  onClick,
  solid,
  children,
}: {
  onClick: () => void;
  solid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
        solid
          ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
          : "text-brand-blue border border-brand-blue/20 hover:bg-brand-blue/5"
      }`}
    >
      {children}
    </button>
  );
}
