"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { AccountFile } from "@/lib/account-files";

// Worker propio en vez del visor nativo del navegador: algunos navegadores tienen
// activada la opción "Descargar PDF en vez de abrirlo", y con eso Chrome se niega a
// pintar un <iframe>/<embed> de PDF (muestra un cuadro con botón "Abrir" en su lugar).
// Renderizando el PDF nosotros mismos (pdf.js a canvas) esto deja de depender de esa
// configuración de cada visitante.
// Servido como estático desde /public (copiado por el script "postinstall") en vez de
// resuelto por el bundler: el .mjs del worker de pdf.js ya viene minificado como módulo
// ES y el minificador de Next intenta reprocesarlo, lo cual rompe el build.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function PdfPreview({ file }: { file: AccountFile }) {
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(280, Math.min(900, Math.floor(w - 16))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="max-h-[600px] overflow-auto bg-slate-100 flex flex-col items-center gap-3 py-4">
      <Document
        file={file.url}
        onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
        loading={
          <div className="flex items-center gap-2 text-brand-blue py-10 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando PDF…
          </div>
        }
        error={
          <div className="text-red-600 text-sm py-10 px-4 text-center">
            No se pudo cargar el PDF. Usa <span className="font-medium">Descargar</span> para abrirlo.
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i} pageNumber={i + 1} width={width} className="shadow mb-3" />
        ))}
      </Document>
    </div>
  );
}

/**
 * Vista previa de un documento ya renderizada en la propia página (sin necesidad
 * de pulsar ningún botón para "abrirlo") — PDF se renderiza con pdf.js (propio, no
 * depende del visor del navegador); imagen usa <img>; .docx se renderiza con
 * docx-preview; .pptx usa el visor público de Office Online.
 */
export default function InlineFilePreview({ file }: { file: AccountFile }) {
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

  if (file.kind === "image") {
    return (
      <div className="flex justify-center bg-slate-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.url} alt={file.name} className="max-w-full max-h-[600px] rounded-lg" />
      </div>
    );
  }

  if (file.kind === "pdf") {
    return <PdfPreview file={file} />;
  }

  if (file.kind === "pptx") {
    return (
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
        title={file.name}
        className="w-full h-[600px] bg-white"
      />
    );
  }

  if (file.kind === "docx") {
    return (
      <div className="max-h-[600px] overflow-auto bg-white p-4">
        {loading && (
          <div className="flex items-center gap-2 text-brand-blue py-10">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando documento…
          </div>
        )}
        {error && <div className="text-red-600 text-sm py-6">{error}</div>}
        <div ref={docRef} className={loading || error ? "hidden" : ""} />
      </div>
    );
  }

  return (
    <div className="text-center text-slate-500 py-10 text-sm">
      La vista previa no está disponible para este formato
      {file.kind === "doc" && " (.doc antiguo — guárdalo como .docx para verlo aquí)"}. Usa
      <span className="font-medium"> Descargar</span> para abrirlo.
    </div>
  );
}
