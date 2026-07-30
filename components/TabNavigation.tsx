"use client";

import { Lock, Pencil } from "lucide-react";
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
}

export default function TabNavigation({ tabs, active, onSelect, canEdit, editMode, onToggleEdit, showEdit }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <button
              key={tab.slug}
              onClick={() => onSelect(tab.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                isActive
                  ? "bg-brand-cyan text-white shadow-sm"
                  : "text-brand-blue hover:bg-brand-cyan-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
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
