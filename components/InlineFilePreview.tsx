"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AccountFile } from "@/lib/account-files";

/**
 * Vista previa de un documento ya renderizada en la propia página (sin necesidad
 * de pulsar ningún botón para "abrirlo") — PDF e imagen usan el visor nativo del
 * navegador embebido en un iframe/img; .docx se renderiza con docx-preview;
 * .pptx usa el visor público de Office Online (misma vía que antes, sin librería nueva).
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
    return <iframe src={file.url} title={file.name} className="w-full h-[600px] bg-white" />;
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
