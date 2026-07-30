import type { AppUser } from "./types";
import { getSupabase } from "./supabase/client";

/**
 * Lista de usuarios autorizados y su rol (administrador / solo lectura).
 *
 * Tabla propia `ao_app_users` (proyecto Supabase compartido con Protágoras,
 * pero con una lista de usuarios totalmente independiente — es gente distinta).
 * Si Supabase no está configurado, cae a `localStorage`.
 */

const USERS_TABLE = "ao_app_users";
const LS_USERS = "ao_users";

export const DEFAULT_USERS: AppUser[] = [{ email: "juan.sanchez@gibobs.com", is_admin: true }];

function readLocal(): AppUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(LS_USERS);
    if (raw) return JSON.parse(raw) as AppUser[];
  } catch {
    /* ignore */
  }
  return DEFAULT_USERS;
}

function writeLocal(users: AppUser[]) {
  try {
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export async function loadUsers(): Promise<AppUser[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from(USERS_TABLE).select("email,is_admin").order("email");
    if (!error && data && data.length > 0) return data as AppUser[];
    if (!error) {
      await sb.from(USERS_TABLE).upsert(DEFAULT_USERS, { onConflict: "email" });
    }
    return DEFAULT_USERS;
  }
  return readLocal();
}

export async function addUser(email: string, isAdmin: boolean): Promise<void> {
  const e = email.trim().toLowerCase();
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(USERS_TABLE).upsert({ email: e, is_admin: isAdmin }, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return;
  }
  const users = readLocal().filter((u) => u.email !== e);
  users.push({ email: e, is_admin: isAdmin });
  writeLocal(users);
}

export async function removeUser(email: string): Promise<void> {
  const e = email.trim().toLowerCase();
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(USERS_TABLE).delete().eq("email", e);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(readLocal().filter((u) => u.email !== e));
}

export async function setUserAdmin(email: string, isAdmin: boolean): Promise<void> {
  const e = email.trim().toLowerCase();
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(USERS_TABLE).update({ is_admin: isAdmin }).eq("email", e);
    if (error) throw new Error(error.message);
    return;
  }
  const users = readLocal();
  const i = users.findIndex((u) => u.email === e);
  if (i !== -1) {
    users[i] = { ...users[i], is_admin: isAdmin };
    writeLocal(users);
  }
}
