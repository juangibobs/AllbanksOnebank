"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2, ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { listFiles, uploadFile, deleteFile, formatSize, type AccountFile } from "@/lib/account-files";
import InlineFilePreview from "./InlineFilePreview";

interface Props {
  accountSlug: string;
  tabSlug: string;
  label: string;
  canManage: boolean;
}

export default function FileLibraryView({ accountSlug, tabSlug, label, canManage }: Props) {
  const [files, setFiles] = useState<AccountFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmPath, setConfirmPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setLoading(true);
    listFiles(accountSlug, tabSlug)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountSlug, tabSlug]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!list.length) return;
    setUploading(true);
    try {
      for (const f of list) await uploadFile(accountSlug, tabSlug, f);
      toast.success(list.length > 1 ? "Documentos subidos" : "Documento subido");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo subir: ${err.message}` : "No se pudo subir");
    } finally {
      setUploading(false);
    }
  };

  const doDelete = async (path: string) => {
    try {
      await deleteFile(path);
      toast.success("Documento eliminado");
      setConfirmPath(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar");
    }
  };

  return (
    <div className="w-full">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">{label}</h2>
          <p className="text-sm text-slate-500 mt-1">PDF, Word, imágenes y PPTX — ya visibles, sin tener que abrirlos.</p>
        </div>
        {canManage && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-cyan text-white hover:bg-brand-cyan-dark transition disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Subiendo…" : "Subir documento"}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".doc,.docx,.pdf,.ppt,.pptx,image/*"
              className="hidden"
              onChange={onPick}
            />
          </>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-blue">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          Todavía no hay documentos.{canManage && " Pulsa “Subir documento” para añadir uno."}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {files.map((f) => (
            <div key={f.path} className="rounded-2xl border border-brand-blue/15 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-brand-blue/10 bg-brand-cyan-50/50">
                <div className="flex items-center gap-2 min-w-0">
                  {f.kind === "image" ? (
                    <ImageIcon className="w-4 h-4 shrink-0 text-brand-blue" />
                  ) : (
                    <FileText className="w-4 h-4 shrink-0 text-brand-blue" />
                  )}
                  <span className="text-sm font-medium text-brand-ink truncate" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={f.url}
                    download={f.name}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-blue border border-brand-blue/20 hover:bg-brand-cyan-50 transition"
                  >
                    <Download className="w-4 h-4" /> Descargar
                  </a>
                  {canManage &&
                    (confirmPath === f.path ? (
                      <button
                        onClick={() => doDelete(f.path)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" /> Confirmar
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmPath(f.path)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    ))}
                </div>
              </div>
              <InlineFilePreview file={f} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
