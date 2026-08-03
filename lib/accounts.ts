import type { Account, AccountSlug } from "./types";

export const ACCOUNTS: Account[] = [
  {
    slug: "allbanks",
    name: "Allbanks",
    sector: "Banca",
    accent: "#64748B",
    tabs: [
      { slug: "noticias", label: "Noticias", kind: "news" },
      { slug: "documentacion", label: "Documentación requerida", kind: "sheet" },
      { slug: "compromisos", label: "Compromisos", kind: "files" },
      { slug: "otros-documentos", label: "Otros documentos", kind: "files" },
      { slug: "manuales", label: "Manuales", kind: "files" },
      { slug: "links", label: "Links relevantes", kind: "markdown" },
    ],
  },
  {
    slug: "onebank",
    name: "Onebank",
    sector: "Banca",
    accent: "#334155",
    tabs: [
      { slug: "documentacion", label: "Documentación requerida", kind: "sheet" },
      { slug: "consentimientos", label: "Consentimientos", kind: "files" },
      { slug: "noticias", label: "Noticias", kind: "news" },
      { slug: "links", label: "Links relevantes", kind: "markdown" },
      { slug: "otros-documentos", label: "Otros documentos", kind: "files" },
      { slug: "politicas-sabadell", label: "Políticas Sabadell", kind: "files" },
      { slug: "operaciones-ropo", label: "Operaciones ropo", kind: "files" },
      { slug: "manuales", label: "Manuales", kind: "files" },
    ],
  },
];

export function getAccount(slug: AccountSlug): Account {
  return ACCOUNTS.find((a) => a.slug === slug) ?? ACCOUNTS[0];
}
