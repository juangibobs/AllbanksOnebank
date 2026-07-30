"use client";

import { useEffect, useState } from "react";
import { Plus, Star, ArrowRight, Loader2 } from "lucide-react";
import type { NewsItem } from "@/lib/types";
import { loadNews, formatNewsDate } from "@/lib/account-news";
import AddNewsModal from "./AddNewsModal";
import NewsReaderModal from "./NewsReaderModal";

interface Props {
  accountSlug: string;
  canAdd: boolean;
}

type Form = { mode: "create" } | { mode: "edit"; item: NewsItem } | null;

export default function NewsView({ accountSlug, canAdd }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(null);
  const [reader, setReader] = useState<NewsItem | null>(null);

  const refresh = () => {
    setLoading(true);
    loadNews(accountSlug)
      .then(setNews)
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountSlug]);

  const featured = news.find((n) => n.featured) ?? news[0] ?? null;
  const rest = news.filter((n) => n.id !== (featured ? featured.id : ""));

  // Mantén el visor sincronizado con la lista tras editar.
  const openReader = (item: NewsItem) => setReader(item);

  return (
    <div className="w-full">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Noticias</h2>
          <p className="text-sm text-slate-500 mt-1">Últimas novedades, comunicados y actualizaciones.</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setForm({ mode: "create" })}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-cyan text-white hover:bg-brand-cyan-dark transition"
          >
            <Plus className="w-4 h-4" /> Añadir noticia
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-blue">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          Todavía no hay noticias.{canAdd && " Pulsa “Añadir noticia” para publicar la primera."}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Noticia destacada (titular grande, clicable) */}
          {featured && (
            <button
              onClick={() => openReader(featured)}
              className="w-full text-left rounded-2xl border border-brand-blue/15 bg-gradient-to-br from-brand-cyan-50 to-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-brand-cyan transition"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue text-white">
                <Star className="w-3.5 h-3.5" /> DESTACADA
              </span>
              <h3 className="mt-4 text-2xl font-bold text-brand-ink leading-snug">{featured.title}</h3>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                <span>{formatNewsDate(featured.created_at)}</span>
                {featured.source && <span className="inline-flex items-center gap-1">🏦 {featured.source}</span>}
                {featured.tag && (
                  <span className="px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue font-medium">{featured.tag}</span>
                )}
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-blue">
                Leer noticia <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          )}

          {/* Rejilla de titulares (clicables) */}
          {rest.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {rest.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openReader(n)}
                  className="text-left rounded-2xl border border-brand-blue/15 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-cyan transition flex flex-col"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatNewsDate(n.created_at)}</span>
                    {n.source && <span className="inline-flex items-center gap-1">🏦 {n.source}</span>}
                    {n.tag && (
                      <span className="px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue font-medium">{n.tag}</span>
                    )}
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-brand-ink leading-snug">{n.title}</h4>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-blue self-start">
                    Ver más <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visor a pantalla completa */}
      {reader && (
        <NewsReaderModal
          item={reader}
          canEdit={canAdd}
          onClose={() => setReader(null)}
          onEdit={() => {
            setForm({ mode: "edit", item: reader });
            setReader(null);
          }}
          onDeleted={() => {
            setReader(null);
            refresh();
          }}
        />
      )}

      {/* Formulario crear/editar */}
      {form && (
        <AddNewsModal
          accountSlug={accountSlug}
          existing={form.mode === "edit" ? form.item : undefined}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
