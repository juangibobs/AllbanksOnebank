"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Loader2 } from "lucide-react";
import type { AccountFile } from "@/lib/account-files";

interface Props {
  file: AccountFile;
  onClose: () => void;
}

export default function DocViewerModal({ file, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(file.kind === "docx");
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file.kind !== "docx") return;
    let cancelled = false;
    (async () => {
      try {
        const [{ renderAsync }, res] = await Promise.all([import("docx-preview"), fetch(file.url)]);
        if (!res.ok) throw new Error("No se pudo descargar el documento");
        const blob = await res.blob();
        if (cancelled || !docRef.current) return;
        docRef.current.innerHTML = "";
        await renderAsync(blob, docRef.current, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo mostrar el documento");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const reset = () => setZoom(1);

  const canZoom = file.kind === "image" || file.kind === "docx";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-100">
      {/* Barra superior */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 bg-white border-b border-brand-blue/10">
        <div className="min-w-0 flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" /> Cerrar
          </button>
          <span className="text-sm font-medium text-brand-ink truncate">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {canZoom && (
            <div className="flex items-center gap-1 rounded-lg border border-brand-blue/15 p-0.5">
              <button onClick={zoomOut} title="Alejar" className="w-8 h-8 rounded-md flex items-center justify-center text-brand-blue hover:bg-brand-cyan-50">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-brand-ink w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={zoomIn} title="Acercar" className="w-8 h-8 rounded-md flex items-center justify-center text-brand-blue hover:bg-brand-cyan-50">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={reset} title="Restablecer zoom" className="w-8 h-8 rounded-md flex items-center justify-center text-brand-blue hover:bg-brand-cyan-50">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
          <a
            href={file.url}
            download={file.name}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-blue border border-brand-blue/20 hover:bg-brand-cyan-50 transition"
          >
            <Download className="w-4 h-4" /> Descargar
          </a>
        </div>
      </div>

      {/* Contenido (scrollable) */}
      <div className="flex-1 overflow-auto p-6">
        {file.kind === "image" && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.name}
              style={{ zoom } as React.CSSProperties}
              className="max-w-none rounded-lg shadow"
            />
          </div>
        )}

        {file.kind === "docx" && (
          <div className="flex justify-center">
            {loading && (
              <div className="flex items-center gap-2 text-brand-blue py-20">
                <Loader2 className="w-5 h-5 animate-spin" /> Cargando documento…
              </div>
            )}
            {error && <div className="text-red-600 py-10">{error}</div>}
            <div ref={docRef} style={{ zoom } as React.CSSProperties} className={loading || error ? "hidden" : ""} />
          </div>
        )}

        {file.kind === "pdf" && (
          <iframe src={file.url} title={file.name} className="w-full h-full min-h-[70vh] rounded-lg bg-white shadow" />
        )}

        {file.kind === "pptx" && (
          // Visor de Office Online (Microsoft) — necesita que el archivo esté en una
          // URL pública (el bucket "ao-files" lo es). No es una API con garantía
          // formal de disponibilidad, pero es la vía estándar para previsualizar
          // PPTX en el navegador sin instalar ninguna librería nueva.
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
            title={file.name}
            className="w-full h-full min-h-[70vh] rounded-lg bg-white shadow"
          />
        )}

        {(file.kind === "doc" || file.kind === "other") && (
          <div className="text-center text-slate-500 py-20">
            La vista previa no está disponible para este formato
            {file.kind === "doc" && " (.doc antiguo — guárdalo como .docx para verlo aquí)"}. Usa
            <span className="font-medium"> Descargar</span> para abrirlo.
          </div>
        )}
      </div>
    </div>
  );
}
