"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  deleteAccount as removeAccount,
  deleteTabContent,
  getAccount,
  kindLabel,
  loadAccounts,
  saveAccount,
  saveOrder,
  SEED_ACCOUNTS,
  uniqueSlug,
} from "@/lib/accounts";
import { loadContent, loadSheet, saveContent, saveSheet } from "@/lib/account-storage";
import { emptyDoc } from "@/lib/sheetData";
import type { Account, AccountSlug, AccountTab, SheetDoc, TabKind } from "@/lib/types";
import Sidebar from "./Sidebar";
import TabNavigation from "./TabNavigation";
import MarkdownContent from "./MarkdownContent";
import SpreadsheetView from "./SpreadsheetView";
import NewsView from "./NewsView";
import FileLibraryView from "./FileLibraryView";
import ManageUsersModal from "./ManageUsersModal";
import { AccountModal, ConfirmDeleteModal, TabModal } from "./StructureModals";

/** Qué diálogo de estructura está abierto. */
type StructureDialog =
  | { type: "account"; account: Account | null }
  | { type: "tab"; tab: AccountTab | null }
  | { type: "delete-account"; account: Account }
  | { type: "delete-tab"; tab: AccountTab }
  | null;

export default function Dashboard() {
  const { email, isAdmin, logout } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [accountSlug, setAccountSlug] = useState<AccountSlug>(SEED_ACCOUNTS[0].slug);
  const [tabSlug, setTabSlug] = useState<string>(SEED_ACCOUNTS[0].tabs[0].slug);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [dialog, setDialog] = useState<StructureDialog>(null);

  // La estructura (cuentas y pestañas) vive en la base de datos.
  useEffect(() => {
    let cancelled = false;
    loadAccounts().then((list) => {
      if (cancelled || list.length === 0) return;
      setAccounts(list);
      const first = list[0];
      setAccountSlug((prev) => (list.some((a) => a.slug === prev) ? prev : first.slug));
      setTabSlug((prev) => {
        const acc = list.find((a) => a.slug === accountSlug) ?? first;
        return acc.tabs.some((t) => t.slug === prev) ? prev : (acc.tabs[0]?.slug ?? "");
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const account = accounts.length > 0 ? getAccount(accounts, accountSlug) : SEED_ACCOUNTS[0];
  const tab: AccountTab | undefined =
    account.tabs.find((t) => t.slug === tabSlug) ?? account.tabs[0];

  const selectAccount = (slug: AccountSlug) => {
    const next = getAccount(accounts, slug);
    setAccountSlug(slug);
    setTabSlug(next.tabs[0]?.slug ?? "");
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

  const isSheet = tab?.kind === "sheet";
  const isMarkdown = tab?.kind === "markdown";
  const showEdit = Boolean(isSheet || isMarkdown);

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

  // -------------------------------------------------------------------------
  // Estructura: cuentas y ventanas
  // -------------------------------------------------------------------------

  const persist = useCallback(async (next: Account[], changed: Account) => {
    setAccounts(next);
    await saveAccount(
      changed,
      next.findIndex((a) => a.slug === changed.slug),
      next,
    );
  }, []);

  async function handleSaveAccount(data: { name: string; sector: string; accent: string }) {
    const editing = dialog?.type === "account" ? dialog.account : null;
    try {
      if (editing) {
        const updated: Account = { ...editing, ...data };
        await persist(
          accounts.map((a) => (a.slug === editing.slug ? updated : a)),
          updated,
        );
        toast.success("Cuenta actualizada");
      } else {
        const created: Account = {
          slug: uniqueSlug(
            data.name,
            accounts.map((a) => a.slug),
            "cuenta",
          ),
          ...data,
          tabs: [],
        };
        const next = [...accounts, created];
        await persist(next, created);
        setAccountSlug(created.slug);
        setTabSlug("");
        toast.success("Cuenta creada. Añádele ahora su primera ventana.");
      }
      setDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la cuenta");
    }
  }

  async function handleDeleteAccount(target: Account) {
    try {
      const next = accounts.filter((a) => a.slug !== target.slug);
      await removeAccount(target.slug, next);
      setAccounts(next);
      await saveOrder(next);
      if (accountSlug === target.slug && next.length > 0) {
        setAccountSlug(next[0].slug);
        setTabSlug(next[0].tabs[0]?.slug ?? "");
      }
      setDialog(null);
      toast.success(`"${target.name}" eliminada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la cuenta");
    }
  }

  async function handleSaveTab(data: { label: string; kind: TabKind }) {
    const editing = dialog?.type === "tab" ? dialog.tab : null;
    try {
      let updated: Account;
      if (editing) {
        // Renombrar conserva el slug, así el contenido guardado sigue asociado.
        updated = {
          ...account,
          tabs: account.tabs.map((t) => (t.slug === editing.slug ? { ...t, label: data.label } : t)),
        };
        toast.success("Ventana renombrada");
      } else {
        const created: AccountTab = {
          slug: uniqueSlug(
            data.label,
            account.tabs.map((t) => t.slug),
            "ventana",
          ),
          label: data.label,
          kind: data.kind,
        };
        updated = { ...account, tabs: [...account.tabs, created] };
        setTabSlug(created.slug);
        toast.success(`Ventana "${data.label}" creada (${kindLabel(data.kind)})`);
      }
      await persist(
        accounts.map((a) => (a.slug === account.slug ? updated : a)),
        updated,
      );
      setDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la ventana");
    }
  }

  async function handleDeleteTab(target: AccountTab) {
    try {
      const updated: Account = {
        ...account,
        tabs: account.tabs.filter((t) => t.slug !== target.slug),
      };
      await persist(
        accounts.map((a) => (a.slug === account.slug ? updated : a)),
        updated,
      );
      await deleteTabContent(account.slug, target.slug);
      if (tabSlug === target.slug) setTabSlug(updated.tabs[0]?.slug ?? "");
      setDialog(null);
      toast.success(`Ventana "${target.label}" eliminada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la ventana");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        accounts={accounts}
        active={accountSlug}
        onSelect={selectAccount}
        email={email}
        isAdmin={isAdmin}
        onManageUsers={() => setShowUsers(true)}
        onLogout={logout}
        onAddAccount={() => setDialog({ type: "account", account: null })}
        onEditAccount={(a) => setDialog({ type: "account", account: a })}
        onDeleteAccount={(a) => setDialog({ type: "delete-account", account: a })}
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
            onAddTab={() => setDialog({ type: "tab", tab: null })}
            onEditTab={(t) => setDialog({ type: "tab", tab: t })}
            onDeleteTab={(t) => setDialog({ type: "delete-tab", tab: t })}
          />
        </div>

        {!tab ? (
          <section className="rounded-2xl border border-dashed border-brand-blue/25 bg-white px-6 py-16 text-center">
            <p className="text-sm text-brand-blue/70">
              Esta cuenta todavía no tiene ninguna ventana.
              {isAdmin
                ? ' Pulsa "Nueva ventana" para crear la primera.'
                : " Pídele a un administrador que cree la primera."}
            </p>
          </section>
        ) : tab.kind === "news" ? (
          <NewsView accountSlug={accountSlug} canAdd={isAdmin} />
        ) : tab.kind === "files" ? (
          <FileLibraryView
            accountSlug={accountSlug}
            tabSlug={tab.slug}
            label={tab.label}
            canManage={isAdmin}
          />
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

      {dialog?.type === "account" && (
        <AccountModal
          account={dialog.account}
          onSave={handleSaveAccount}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "tab" && (
        <TabModal tab={dialog.tab} onSave={handleSaveTab} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "delete-account" && (
        <ConfirmDeleteModal
          title="Eliminar cuenta"
          description={`Se eliminará "${dialog.account.name}" con sus ${dialog.account.tabs.length} ventana(s) y el contenido guardado en ellas. Los archivos ya subidos se conservan en el almacenamiento. Esta acción no se puede deshacer.`}
          onConfirm={() => handleDeleteAccount(dialog.account)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete-tab" && (
        <ConfirmDeleteModal
          title="Eliminar ventana"
          description={`Se eliminará "${dialog.tab.label}" y su contenido guardado. Los archivos ya subidos se conservan en el almacenamiento. Esta acción no se puede deshacer.`}
          onConfirm={() => handleDeleteTab(dialog.tab)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
