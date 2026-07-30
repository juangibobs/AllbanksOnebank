"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AppUser } from "./types";
import { loadUsers } from "./account-users";
import { getSupabase } from "./supabase/client";

/**
 * Autenticación de "perfiles autorizados" con dos roles (administrador / lectura).
 *
 * - Con Supabase configurado (producción): acceso mediante enlace mágico —
 *   el usuario introduce su email y recibe un enlace de un solo uso en su
 *   bandeja de entrada; al abrirlo queda autenticado. No hay contraseña
 *   compartida: quien no controle esa bandeja no puede entrar aunque conozca
 *   la dirección.
 * - Sin Supabase configurado (desarrollo local sin backend): login con
 *   contraseña compartida, solo para poder probar la app sin depender de un
 *   proyecto de Supabase real.
 *
 * En ambos casos, solo pueden entrar los emails de la lista de usuarios
 * autorizados (lib/account-users.ts); el rol (admin/lectura) también sale de ahí.
 */

const APP_PASSWORD = "allbanks2026";
const STORAGE_KEY = "ao_session";

interface AuthContextValue {
  email: string | null;
  isAdmin: boolean;
  users: AppUser[];
  ready: boolean;
  sendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [ready, setReady] = useState(false);
  const usersRef = useRef<AppUser[]>([]);
  usersRef.current = users;

  const refreshUsers = async () => {
    const list = await loadUsers();
    setUsers(list);
  };

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabase();
    let unsubscribe: (() => void) | undefined;

    const applySession = async (session: { user: { email?: string | null } } | null) => {
      const authEmail = session?.user?.email?.trim().toLowerCase() ?? null;
      if (!authEmail) {
        if (!cancelled) setEmail(null);
        return;
      }
      const list = await loadUsers();
      if (cancelled) return;
      setUsers(list);
      if (list.some((u) => u.email === authEmail)) {
        setEmail(authEmail);
      } else {
        // Se autenticó con un enlace válido pero ya no está en la lista de
        // autorizados (p. ej. lo quitó un admin): fuera.
        await sb?.auth.signOut();
        setEmail(null);
      }
    };

    loadUsers().then(async (list) => {
      if (cancelled) return;
      setUsers(list);

      if (sb) {
        const { data } = await sb.auth.getSession();
        if (!cancelled) await applySession(data.session);
        const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
          applySession(session);
        });
        unsubscribe = () => sub.subscription.unsubscribe();
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved && list.some((u) => u.email === saved)) {
            setEmail(saved);
          } else if (saved) {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const sendMagicLink: AuthContextValue["sendMagicLink"] = async (rawEmail) => {
    const e = rawEmail.trim().toLowerCase();
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Supabase no configurado" };
    const list = await loadUsers();
    setUsers(list);
    if (!list.some((u) => u.email === e)) {
      return { ok: false, error: "Usuario no autorizado" };
    }
    const { error } = await sb.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const login: AuthContextValue["login"] = (rawEmail, password) => {
    const e = rawEmail.trim().toLowerCase();
    if (!usersRef.current.some((u) => u.email === e)) {
      return { ok: false, error: "Usuario no autorizado" };
    }
    if (password !== APP_PASSWORD) {
      return { ok: false, error: "Contraseña incorrecta" };
    }
    try {
      localStorage.setItem(STORAGE_KEY, e);
    } catch {
      /* ignore */
    }
    setEmail(e);
    return { ok: true };
  };

  const logout = () => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut();
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    setEmail(null);
  };

  const isAdmin = !!email && users.some((u) => u.email === email && u.is_admin);

  return (
    <AuthContext.Provider
      value={{ email, isAdmin, users, ready, sendMagicLink, login, logout, refreshUsers }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
