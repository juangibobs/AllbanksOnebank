-- Allbanks&Onebank — cuentas y pestañas editables desde la app.
--
-- Hasta ahora las cuentas (Allbanks, Onebank) y sus pestañas estaban fijas en
-- el código (lib/accounts.ts). Esta tabla las saca a base de datos para que un
-- administrador pueda crearlas, renombrarlas, reordenarlas y borrarlas desde la
-- propia web.
--
-- Ejecútalo UNA VEZ en: Supabase → el proyecto compartido → SQL Editor → New
-- query → pega y Run. Es aditivo: no toca ninguna tabla existente.
--
-- La app siembra sola las dos cuentas actuales con sus pestañas la primera vez
-- que arranca con la tabla vacía, así que al día siguiente todo se ve igual que
-- antes; a partir de ahí ya es editable.

create table if not exists public.ao_accounts (
  slug       text primary key,
  name       text not null,
  sector     text not null default '',
  accent     text not null default '#64748B',
  position   integer not null default 0,
  -- Array de pestañas: [{ "slug": "...", "label": "...", "kind": "sheet" }, ...]
  -- kind ∈ markdown | sheet | files | news
  tabs       jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ao_accounts_position_idx on public.ao_accounts(position);

alter table public.ao_accounts enable row level security;

drop policy if exists "ao_accounts read"   on public.ao_accounts;
drop policy if exists "ao_accounts insert" on public.ao_accounts;
drop policy if exists "ao_accounts update" on public.ao_accounts;
drop policy if exists "ao_accounts delete" on public.ao_accounts;

create policy "ao_accounts read"   on public.ao_accounts for select using (true);
create policy "ao_accounts insert" on public.ao_accounts for insert with check (true);
create policy "ao_accounts update" on public.ao_accounts for update using (true) with check (true);
create policy "ao_accounts delete" on public.ao_accounts for delete using (true);

-- Al borrar una pestaña o una cuenta desde la app se borra también su contenido
-- en ao_account_tabs. Esta política permite ese borrado (antes solo había
-- select/insert/update).
drop policy if exists "ao delete" on public.ao_account_tabs;
create policy "ao delete" on public.ao_account_tabs for delete using (true);
