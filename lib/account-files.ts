import { getSupabase } from "./supabase/client";

/**
 * Librerías de archivos (Compromisos, Otros documentos, Consentimientos, etc.):
 * Word, PDF, imágenes y PPTX. Se guardan en el bucket público de Supabase
 * Storage `ao-files`, en una carpeta `<cuenta>/<pestaña>` — una pestaña de tipo
 * "files" puede repetirse varias veces por cuenta, cada una con su propia carpeta.
 */

export const FILES_BUCKET = "ao-files";

export type FileKind = "image" | "docx" | "doc" | "pdf" | "pptx" | "other";

export interface AccountFile {
  name: string; // nombre mostrado (original)
  path: string; // ruta en el bucket (cuenta/pestaña/archivo)
  url: string; // URL pública
  kind: FileKind;
  size: number;
  created_at: string;
}

export function fileKind(name: string): FileKind {
  const n = name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(n)) return "image";
  if (n.endsWith(".docx")) return "docx";
  if (n.endsWith(".doc")) return "doc";
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".pptx")) return "pptx";
  return "other";
}

/** Quita el prefijo "timestamp-" del nombre almacenado para mostrar el original. */
function displayName(stored: string): string {
  return stored.replace(/^\d+-/, "");
}

export async function listFiles(account: string, tab: string): Promise<AccountFile[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const folder = `${account}/${tab}`;
  const { data, error } = await sb.storage.from(FILES_BUCKET).list(folder, {
    sortBy: { column: "created_at", order: "desc" },
    limit: 200,
  });
  if (error || !data) return [];
  return data
    .filter((f) => f.name && f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const path = `${folder}/${f.name}`;
      const { data: pub } = sb.storage.from(FILES_BUCKET).getPublicUrl(path);
      return {
        name: displayName(f.name),
        path,
        url: pub.publicUrl,
        kind: fileKind(f.name),
        size: (f.metadata?.size as number) ?? 0,
        created_at: (f.created_at as string) ?? "",
      };
    });
}

export async function uploadFile(account: string, tab: string, file: File): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Almacenamiento no configurado");
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${account}/${tab}/${Date.now()}-${safe}`;
  const { error } = await sb.storage.from(FILES_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

export async function deleteFile(path: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Almacenamiento no configurado");
  const { error } = await sb.storage.from(FILES_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
