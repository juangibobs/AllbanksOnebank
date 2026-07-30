"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Eye, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { listFiles, uploadFile, deleteFile, formatSize, type AccountFile } from "@/lib/account-files";
import DocViewerModal from "./DocViewerModal";

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
  const [viewing, setViewing] = useState<AccountFile | null>(null);
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
          <p className="text-sm text-slate-500 mt-1">PDF, Word, imágenes y PPTX.</p>
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <div key={f.path} className="rounded-2xl border border-brand-blue/15 bg-white shadow-sm overflow-hidden flex flex-col">
              <button
                onClick={() => setViewing(f)}
                className="block w-full h-40 bg-brand-cyan-50 flex items-center justify-center overflow-hidden group"
                title="Ver"
              >
                {f.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <FileText className="w-14 h-14 text-brand-blue/50" />
                )}
              </button>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  {f.kind === "image" ? (
                    <ImageIcon className="w-4 h-4 shrink-0 text-brand-blue" />
                  ) : (
                    <FileText className="w-4 h-4 shrink-0 text-brand-blue" />
                  )}
                  <span className="text-sm font-medium text-brand-ink truncate" title={f.name}>
                    {f.name}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatSize(f.size)}</span>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => setViewing(f)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-cyan text-white hover:bg-brand-cyan-dark transition"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </button>
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
            </div>
          ))}
        </div>
      )}

      {viewing && <DocViewerModal file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
