"use client";

import { LogOut, Pencil, Plus, Trash2, Users } from "lucide-react";
import type { Account, AccountSlug } from "@/lib/types";
import AOLogo from "./AOLogo";

interface Props {
  accounts: Account[];
  active: AccountSlug;
  onSelect: (account: AccountSlug) => void;
  email: string | null;
  isAdmin: boolean;
  onManageUsers: () => void;
  onLogout: () => void;
  /** Alta de cuenta (solo administradores). */
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
}

export default function Sidebar({
  accounts,
  active,
  onSelect,
  email,
  isAdmin,
  onManageUsers,
  onLogout,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}: Props) {
  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-brand-blue/15">
      {/* Cabecera / logo */}
      <div className="px-5 py-6 border-b border-brand-blue/10">
        <div className="flex items-center gap-3">
          <AOLogo className="w-10 h-10 rounded-xl shadow-sm" />
          <div>
            <h1 className="text-lg font-bold text-brand-ink leading-tight">Allbanks&amp;Onebank</h1>
            <p className="text-[11px] text-brand-blue/70">Portal documental</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-brand-blue/60 mb-3">
          Cuentas
        </p>
        <div className="space-y-2">
          {accounts.map((account) => {
            const isActive = account.slug === active;
            return (
              <div key={account.slug} className="group relative">
                <button
                  onClick={() => onSelect(account.slug)}
                  className={`w-full text-left rounded-xl border py-3 pl-4 transition ${
                    isAdmin ? "pr-16" : "pr-4"
                  } ${
                    isActive
                      ? "border-transparent text-white shadow-sm"
                      : "border-brand-blue/15 bg-white hover:bg-brand-cyan-50 text-brand-ink"
                  }`}
                  style={isActive ? { background: account.accent } : undefined}
                >
                  <span className="block text-sm font-semibold">{account.name}</span>
                  <span
                    className={`block text-xs ${isActive ? "text-white/80" : "text-brand-blue/60"}`}
                  >
                    {account.sector}
                  </span>
                </button>

                {isAdmin && (
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={() => onEditAccount(account)}
                      aria-label={`Renombrar ${account.name}`}
                      title="Renombrar"
                      className={`rounded-md p-1.5 transition ${
                        isActive ? "text-white/80 hover:bg-white/20" : "text-brand-blue/70 hover:bg-brand-blue/10"
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAccount(account)}
                      aria-label={`Eliminar ${account.name}`}
                      title="Eliminar"
                      className={`rounded-md p-1.5 transition ${
                        isActive ? "text-white/80 hover:bg-white/20" : "text-brand-blue/70 hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <button
            onClick={onAddAccount}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-blue/30 px-4 py-2.5 text-sm font-medium text-brand-blue transition hover:bg-brand-cyan-50"
          >
            <Plus className="h-4 w-4" /> Añadir cuenta
          </button>
        )}
      </nav>

      {/* Sesión */}
      <div className="px-4 py-4 border-t border-brand-blue/10 space-y-2">
        {isAdmin && (
          <button
            onClick={onManageUsers}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-blue border border-brand-blue/15 hover:bg-brand-cyan-50 transition"
          >
            <Users className="w-4 h-4" /> Gestionar usuarios
          </button>
        )}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-cyan-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-brand-blue/60">
              Sesión {isAdmin ? "· Administrador" : "· Solo lectura"}
            </p>
            <p className="text-xs font-medium text-brand-ink truncate" title={email ?? ""}>
              {email}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-brand-blue hover:bg-white transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
