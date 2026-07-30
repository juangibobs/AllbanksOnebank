"use client";

import { useState } from "react";
import { LogIn, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import AOLogo from "./AOLogo";

export default function LoginScreen() {
  const { login, sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    if (isSupabaseConfigured) {
      const res = await sendMagicLink(email);
      if (res.ok) setSent(true);
      else setError(res.error ?? "No se pudo enviar el enlace");
    } else {
      const res = login(email, password);
      if (!res.ok) setError(res.error ?? "No se pudo iniciar sesión");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Bloque izquierdo — con logo */}
      <div className="hidden md:flex items-center justify-center bg-brand-ink p-12">
        <div className="text-center">
          <AOLogo className="w-32 h-32 mx-auto rounded-3xl shadow-2xl" />
          <p className="mt-6 text-xl font-bold text-white">Allbanks&amp;Onebank</p>
        </div>
      </div>

      {/* Bloque derecho — formulario */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden flex justify-center">
            <AOLogo className="h-20 w-20 rounded-2xl shadow-lg" />
          </div>

          {isSupabaseConfigured && sent ? (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-brand-cyan-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-brand-blue" />
              </div>
              <h2 className="text-2xl font-bold text-brand-ink">Revisa tu correo</h2>
              <p className="mt-2 text-sm text-slate-500">
                Te hemos enviado un enlace de acceso a{" "}
                <span className="font-medium text-brand-ink">{email}</span>. Ábrelo desde este
                dispositivo para entrar. El enlace caduca en un rato y solo vale una vez.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
                className="mt-6 text-sm font-medium text-brand-blue hover:underline"
              >
                Usar otro email
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <h2 className="text-2xl font-bold text-brand-ink">Acceso Perfiles Autorizados</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isSupabaseConfigured
                  ? "Introduce tu email y te enviamos un enlace de acceso."
                  : "Inicia sesión para continuar"}
              </p>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="username"
                    className="w-full rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                    placeholder="nombre@empresa.com"
                    required
                  />
                </div>

                {!isSupabaseConfigured && (
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-brand-blue/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-white hover:bg-brand-cyan-dark transition disabled:opacity-60"
                >
                  {isSupabaseConfigured ? <Mail className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {submitting
                    ? isSupabaseConfigured
                      ? "Enviando…"
                      : "Accediendo…"
                    : isSupabaseConfigured
                      ? "Enviar enlace de acceso"
                      : "Acceder"}
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                Acceso restringido a perfiles autorizados.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
