"use client";

import { Lock, Pencil, Plus, SquarePen, Trash2 } from "lucide-react";
import type { AccountTab } from "@/lib/types";

interface Props {
  tabs: AccountTab[];
  active: string;
  onSelect: (tab: string) => void;
  canEdit: boolean;
  editMode: boolean;
  onToggleEdit: () => void;
  /** Muestra el botón "Modificar Ficha" (no aplica a pestañas de noticias/archivos). */
  showEdit: boolean;
  /** Alta de pestaña (solo administradores). */
  onAddTab: () => void;
  onEditTab: (tab: AccountTab) => void;
  onDeleteTab: (tab: AccountTab) => void;
}

export default function TabNavigation({
  tabs,
  active,
  onSelect,
  canEdit,
  editMode,
  onToggleEdit,
  showEdit,
  onAddTab,
  onEditTab,
  onDeleteTab,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <div key={tab.slug} className="group relative flex items-center">
              <button
                onClick={() => onSelect(tab.slug)}
                className={`rounded-full py-2 pl-4 text-sm font-medium transition ${
                  canEdit && isActive ? "pr-16" : "pr-4"
                } ${
                  isActive
                    ? "bg-brand-cyan text-white shadow-sm"
                    : "text-brand-blue hover:bg-brand-cyan-50"
                }`}
              >
                {tab.label}
              </button>

              {/* Renombrar y eliminar, solo en la pestaña activa para no saturar la barra. */}
              {canEdit && isActive && (
                <div className="absolute right-2 flex gap-0.5">
                  <button
                    onClick={() => onEditTab(tab)}
                    aria-label={`Renombrar ${tab.label}`}
                    title="Renombrar ventana"
                    className="rounded-md p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <SquarePen className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTab(tab)}
                    aria-label={`Eliminar ${tab.label}`}
                    title="Eliminar ventana"
                    className="rounded-md p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {canEdit && (
          <button
            onClick={onAddTab}
            title="Añadir ventana"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand-blue/30 px-3.5 py-2 text-sm font-medium text-brand-blue transition hover:bg-brand-cyan-50"
          >
            <Plus className="h-4 w-4" /> Nueva ventana
          </button>
        )}
      </div>

      {showEdit && (
        <button
          onClick={onToggleEdit}
          disabled={!canEdit}
          title={canEdit ? undefined : "Solo los administradores pueden editar"}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            !canEdit
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : editMode
                ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
                : "bg-brand-cyan text-white hover:bg-brand-cyan-dark"
          }`}
        >
          {canEdit ? <Pencil className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {editMode ? "Vista previa" : "Modificar Ficha"}
        </button>
      )}
    </div>
  );
}
