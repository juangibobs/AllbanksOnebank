"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addNews, updateNews } from "@/lib/account-news";
import type { NewsItem } from "@/lib/types";

interface Props {
  accountSlug: string;
  /** Si se pasa, el modal edita esa noticia; si no, crea una nueva. */
  existing?: NewsItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddNewsModal({ accountSlug, existing, onClose, onSaved }: Props) {
  const isEdit = !!existing;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [source, setSource] = useState(existing?.source ?? "");
  const [tag, setTag] = useState(existing?.tag ?? "");
  const [featured, setFeatured] = useState(existing?.featured ?? false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const payload = { title: title.trim(), body: body.trim(), source: source.trim(), tag: tag.trim(), featured };
    try {
      if (isEdit) await updateNews(accountSlug, existing!.id, payload);
      else await addNews(accountSlug, payload);
      toast.success(isEdit ? "Noticia actualizada" : "Noticia publicada");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo guardar: ${err.message}` : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-brand-blue/15 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-blue/10">
          <h3 className="text-lg font-semibold text-brand-ink">{isEdit ? "Editar noticia" : "Nueva noticia"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Ej. 🚀 Nueva campaña…"
              className="w-full rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5">Contenido</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Escribe aquí la noticia…"
              className="w-full rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Fuente / Entidad</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ej. BBVA"
                className="w-full rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Etiqueta (opcional)</label>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ej. normativa"
                className="w-full rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-brand-cyan"
            />
            Destacar (mostrar como noticia principal)
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-cyan text-white hover:bg-brand-cyan-dark transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Publicar noticia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
