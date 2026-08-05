"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CREATABLE_KINDS } from "@/lib/accounts";
import type { Account, AccountTab, TabKind } from "@/lib/types";

const ACCENTS = ["#64748B", "#334155", "#2478C1", "#00A3A6", "#7C3AED", "#DB2777", "#059669", "#D97706"];

function Shell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-blue/10 px-5 py-4">
          <h3 className="text-base font-semibold text-brand-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Alta y renombrado de cuentas (entidades del menú lateral). */
export function AccountModal({
  account,
  onSave,
  onClose,
}: {
  /** null = crear una nueva. */
  account: Account | null;
  onSave: (data: { name: string; sector: string; accent: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [sector, setSector] = useState(account?.sector ?? "");
  const [accent, setAccent] = useState(account?.accent ?? ACCENTS[0]);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), sector: sector.trim(), accent });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell title={account ? "Renombrar cuenta" : "Nueva cuenta"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-ink">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Banco Ejemplo"
            autoFocus
            required
            className="w-full rounded-lg border border-brand-blue/20 px-3 py-2 text-sm outline-none focus:border-brand-cyan"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-ink">Descripción</label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Banca"
            className="w-full rounded-lg border border-brand-blue/20 px-3 py-2 text-sm outline-none focus:border-brand-cyan"
          />
          <p className="text-xs text-brand-blue/60">Se muestra en pequeño bajo el nombre.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-ink">Color</label>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAccent(c)}
                aria-label={`Color ${c}`}
                className={`h-8 w-8 rounded-full transition ${
                  accent === c ? "ring-2 ring-brand-ink ring-offset-2" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cyan-dark disabled:opacity-60"
          >
            {saving ? "Guardando…" : account ? "Guardar" : "Crear cuenta"}
          </button>
        </div>
      </form>
    </Shell>
  );
}

/** Alta y renombrado de pestañas ("ventanas") dentro de una cuenta. */
export function TabModal({
  tab,
  onSave,
  onClose,
}: {
  /** null = crear una nueva. */
  tab: AccountTab | null;
  onSave: (data: { label: string; kind: TabKind }) => Promise<void>;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(tab?.label ?? "");
  const [kind, setKind] = useState<TabKind>(tab?.kind ?? "markdown");
  const [saving, setSaving] = useState(false);

  // Al renombrar no se cambia el tipo: el contenido guardado no sería compatible.
  const isEditing = tab !== null;

  useEffect(() => {
    if (tab) setKind(tab.kind);
  }, [tab]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onSave({ label: label.trim(), kind });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell title={isEditing ? "Renombrar ventana" : "Nueva ventana"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-ink">Nombre</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Documentación requerida"
            autoFocus
            required
            className="w-full rounded-lg border border-brand-blue/20 px-3 py-2 text-sm outline-none focus:border-brand-cyan"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-ink">Tipo de contenido</label>
          {isEditing ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-brand-blue/80">
              {CREATABLE_KINDS.find((k) => k.kind === kind)?.label ?? kind} — el tipo no se puede
              cambiar una vez creada, porque el contenido ya guardado no sería compatible.
            </p>
          ) : (
            <div className="space-y-2">
              {CREATABLE_KINDS.map((k) => (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => setKind(k.kind)}
                  className={`flex w-full flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition ${
                    kind === k.kind
                      ? "border-brand-cyan bg-brand-cyan-50"
                      : "border-brand-blue/15 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-semibold text-brand-ink">{k.label}</span>
                  <span className="text-xs text-brand-blue/70">{k.help}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cyan-dark disabled:opacity-60"
          >
            {saving ? "Guardando…" : isEditing ? "Guardar" : "Crear ventana"}
          </button>
        </div>
      </form>
    </Shell>
  );
}

/** Confirmación de borrado, con aviso de lo que se pierde. */
export function ConfirmDeleteModal({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Shell title={title} onClose={onClose}>
      <div className="space-y-5 px-5 py-5">
        <p className="text-sm text-brand-blue/80">{description}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
