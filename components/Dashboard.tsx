"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ACCOUNTS, getAccount } from "@/lib/accounts";
import { loadContent, loadSheet, saveContent, saveSheet } from "@/lib/account-storage";
import { emptyDoc } from "@/lib/sheetData";
import type { AccountSlug, SheetDoc } from "@/lib/types";
import Sidebar from "./Sidebar";
import TabNavigation from "./TabNavigation";
import MarkdownContent from "./MarkdownContent";
import SpreadsheetView from "./SpreadsheetView";
import NewsView from "./NewsView";
import FileLibraryView from "./FileLibraryView";
import ManageUsersModal from "./ManageUsersModal";

export default function Dashboard() {
  const { email, isAdmin, logout } = useAuth();

  const [accountSlug, setAccountSlug] = useState<AccountSlug>(ACCOUNTS[0].slug);
  const [tabSlug, setTabSlug] = useState<string>(ACCOUNTS[0].tabs[0].slug);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  const account = getAccount(accountSlug);
  const tab = account.tabs.find((t) => t.slug === tabSlug) ?? account.tabs[0];

  const selectAccount = (slug: AccountSlug) => {
    const next = getAccount(slug);
    setAccountSlug(slug);
    setTabSlug(next.tabs[0].slug);
    setEditMode(false);
  };

  const selectTab = (slug: string) => {
    setTabSlug(slug);
    setEditMode(false);
  };

  // Valores guardados (arrancan vacíos; se cargan de la BD/localStorage al montar)
  const [content, setContent] = useState<string>("");
  const [sheet, setSheet] = useState<SheetDoc>(() => emptyDoc());

  // Borradores en edición
  const [contentDraft, setContentDraft] = useState<string>("");
  const [sheetDraft, setSheetDraft] = useState<SheetDoc>(() => emptyDoc());

  const isSheet = tab.kind === "sheet";
  const isMarkdown = tab.kind === "markdown";
  const showEdit = isSheet || isMarkdown;

  // Cargar contenido/hoja al cambiar de cuenta o pestaña (solo si aplica a este tipo de pestaña).
  useEffect(() => {
    let cancelled = false;
    if (isMarkdown) {
      loadContent(accountSlug, tabSlug).then((c) => {
        if (!cancelled) setContent(c);
      });
    } else if (isSheet) {
      loadSheet(accountSlug, tabSlug).then((s) => {
        if (!cancelled) setSheet(s);
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountSlug, tabSlug]);

  const enterEdit = () => {
    setContentDraft(content);
    setSheetDraft(sheet);
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      if (isSheet) {
        await saveSheet(accountSlug, tabSlug, sheetDraft);
        setSheet(sheetDraft);
      } else {
        await saveContent(accountSlug, tabSlug, contentDraft);
        setContent(contentDraft);
      }
      setEditMode(false);
      toast.success("Base de datos actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? `No se pudo guardar: ${err.message}` : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        accounts={ACCOUNTS}
        active={accountSlug}
        onSelect={selectAccount}
        email={email}
        isAdmin={isAdmin}
        onManageUsers={() => setShowUsers(true)}
        onLogout={logout}
      />

      <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">
        {/* Cabecera */}
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wide text-brand-blue/60">Cuenta activa</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: account.accent }} />
            <h2 className="text-2xl font-bold text-brand-ink">{account.name}</h2>
          </div>
        </header>

        {/* Pestañas */}
        <div className="mb-5">
          <TabNavigation
            tabs={account.tabs}
            active={tabSlug}
            onSelect={selectTab}
            canEdit={isAdmin}
            editMode={editMode}
            onToggleEdit={editMode ? cancelEdit : enterEdit}
            showEdit={showEdit}
          />
        </div>

        {tab.kind === "news" ? (
          <NewsView accountSlug={accountSlug} canAdd={isAdmin} />
        ) : tab.kind === "files" ? (
          <FileLibraryView accountSlug={accountSlug} tabSlug={tab.slug} label={tab.label} canManage={isAdmin} />
        ) : (
          /* Tarjeta de contenido (markdown / sheet) */
          <section className="bg-white border border-brand-blue/15 rounded-2xl p-6 lg:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-ink mb-5">{tab.label}</h3>

            {isSheet ? (
              <SpreadsheetView
                doc={editMode ? sheetDraft : sheet}
                editMode={editMode}
                onChange={setSheetDraft}
              />
            ) : (
              <MarkdownContent
                content={editMode ? contentDraft : content}
                editMode={editMode}
                onChange={setContentDraft}
              />
            )}

            {editMode && (
              <div className="flex items-center justify-end gap-2 mt-6 pt-5 border-t border-brand-blue/10">
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-cyan text-white hover:bg-brand-cyan-dark transition disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {saving ? "Guardando…" : "Guardar Cambios"}
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {showUsers && <ManageUsersModal onClose={() => setShowUsers(false)} />}
    </div>
  );
}
