"use client";

import { useState } from "react";
import { X, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import type { NewsItem } from "@/lib/types";
import { deleteNews, formatNewsDate } from "@/lib/account-news";

interface Props {
  item: NewsItem;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

export default function NewsReaderModal({ item, canEdit, onClose, onEdit, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteNews(item.account_slug, item.id);
      toast.success("Noticia eliminada");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Barra superior */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-brand-blue/10 bg-white/90 backdrop-blur">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" /> Cerrar
        </button>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-blue border border-brand-blue/20 hover:bg-brand-cyan-50 transition"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
            {confirming ? (
              <button
                onClick={doDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar borrado
              </button>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenido a pantalla completa */}
      <article className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
          {item.featured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue text-white">
              <Star className="w-3.5 h-3.5" /> DESTACADA
            </span>
          )}
          <span>{formatNewsDate(item.created_at)}</span>
          {item.source && <span className="inline-flex items-center gap-1">🏦 {item.source}</span>}
          {item.tag && (
            <span className="px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue font-medium">{item.tag}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-brand-ink leading-tight">{item.title}</h1>
        <div className="mt-6 text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">{item.body}</div>
      </article>
    </div>
  );
}
