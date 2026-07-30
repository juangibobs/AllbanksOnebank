"use client";

import { useState } from "react";
import { X, Trash2, Loader2, UserPlus, ShieldCheck, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addUser, removeUser, setUserAdmin } from "@/lib/account-users";

interface Props {
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ManageUsersModal({ onClose }: Props) {
  const { users, email: myEmail, refreshUsers } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const admins = users.filter((u) => u.is_admin);

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      toast.error("Email no válido");
      return;
    }
    setAdding(true);
    try {
      await addUser(clean, newIsAdmin);
      await refreshUsers();
      toast.success("Usuario añadido");
      setNewEmail("");
      setNewIsAdmin(false);
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo añadir: ${err.message}` : "No se pudo añadir");
    } finally {
      setAdding(false);
    }
  };

  const toggleAdmin = async (targetEmail: string, current: boolean) => {
    if (current && admins.length <= 1) {
      toast.error("Debe quedar al menos un administrador");
      return;
    }
    setBusyEmail(targetEmail);
    try {
      await setUserAdmin(targetEmail, !current);
      await refreshUsers();
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo actualizar: ${err.message}` : "No se pudo actualizar");
    } finally {
      setBusyEmail(null);
    }
  };

  const doRemove = async (targetEmail: string, isTargetAdmin: boolean) => {
    if (isTargetAdmin && admins.length <= 1) {
      toast.error("Debe quedar al menos un administrador");
      setConfirmEmail(null);
      return;
    }
    setBusyEmail(targetEmail);
    try {
      await removeUser(targetEmail);
      await refreshUsers();
      toast.success("Usuario eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo eliminar: ${err.message}` : "No se pudo eliminar");
    } finally {
      setBusyEmail(null);
      setConfirmEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-brand-blue/15 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-blue/10">
          <h3 className="text-lg font-semibold text-brand-ink">Gestionar usuarios</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.email}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand-blue/15 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-ink truncate" title={u.email}>
                    {u.email}
                    {u.email === myEmail && <span className="ml-1.5 text-xs text-brand-blue/60">(tú)</span>}
                  </p>
                  <p className="text-xs text-slate-500">{u.is_admin ? "Administrador" : "Solo lectura"}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleAdmin(u.email, u.is_admin)}
                    disabled={busyEmail === u.email}
                    title={u.is_admin ? "Quitar permisos de administrador" : "Hacer administrador"}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-60 ${
                      u.is_admin
                        ? "bg-brand-blue text-white border-transparent hover:bg-brand-blue-dark"
                        : "text-brand-blue border-brand-blue/20 hover:bg-brand-cyan-50"
                    }`}
                  >
                    {u.is_admin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    {u.is_admin ? "Admin" : "Lectura"}
                  </button>
                  {confirmEmail === u.email ? (
                    <button
                      onClick={() => doRemove(u.email, u.is_admin)}
                      disabled={busyEmail === u.email}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
                    >
                      {busyEmail === u.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmEmail(u.email)}
                      title="Eliminar usuario"
                      className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitAdd} className="pt-4 border-t border-brand-blue/10 space-y-3">
            <p className="text-sm font-medium text-brand-ink">Añadir usuario</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="flex-1 min-w-0 rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                required
              />
              <button
                type="submit"
                disabled={adding || !newEmail.trim()}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-cyan text-white hover:bg-brand-cyan-dark transition disabled:opacity-60"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Añadir
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="w-4 h-4 accent-brand-cyan"
              />
              Hacer administrador
            </label>
          </form>
        </div>
      </div>
    </div>
  );
}
