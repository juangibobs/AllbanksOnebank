"use client";

import { useAuth } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";

export default function Page() {
  const { email, ready } = useAuth();

  // Evita parpadeo/hidratación hasta saber si hay sesión.
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  return email ? <Dashboard /> : <LoginScreen />;
}
