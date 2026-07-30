-- Allbanks&Onebank — esquema de Supabase
--
-- IMPORTANTE: esta app comparte el MISMO proyecto de Supabase que Protágoras
-- (para no superar el límite de 2 proyectos gratis por cuenta). Todas las
-- tablas y el bucket de esta app usan el prefijo "ao_" / "ao-" para no chocar
-- con las tablas de Protágoras (bank_tabs, news, app_users, flujo-clientes).
--
-- Ejecuta este script en: Supabase → el proyecto compartido → SQL Editor → New
-- query → pega y Run. Es aditivo: no toca ninguna tabla de Protágoras.

-- Contenido editable de cada pestaña de tipo "sheet"/"markdown".
-- Una fila por (cuenta, pestaña): id = "<cuenta>:<pestaña>".
create table if not exists public.ao_account_tabs (
  id           text primary key,
  account_slug text not null,
  tab_slug     text not null,
  content      text,
  sheet        jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.ao_account_tabs enable row level security;

drop policy if exists "ao read" on public.ao_account_tabs;
drop policy if exists "ao insert" on public.ao_account_tabs;
drop policy if exists "ao update" on public.ao_account_tabs;

create policy "ao read"   on public.ao_account_tabs for select using (true);
create policy "ao insert" on public.ao_account_tabs for insert with check (true);
create policy "ao update" on public.ao_account_tabs for update using (true) with check (true);

-- Feed de Noticias, independiente por cuenta (a diferencia de Protágoras, que
-- lo tiene global).
create table if not exists public.ao_news (
  id           uuid primary key default gen_random_uuid(),
  account_slug text not null,
  title        text not null,
  body         text,
  source       text,
  tag          text,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists ao_news_account_slug_idx on public.ao_news(account_slug);

alter table public.ao_news enable row level security;

drop policy if exists "ao_news read" on public.ao_news;
drop policy if exists "ao_news insert" on public.ao_news;
drop policy if exists "ao_news update" on public.ao_news;
drop policy if exists "ao_news delete" on public.ao_news;

create policy "ao_news read"   on public.ao_news for select using (true);
create policy "ao_news insert" on public.ao_news for insert with check (true);
create policy "ao_news update" on public.ao_news for update using (true) with check (true);
create policy "ao_news delete" on public.ao_news for delete using (true);

-- Usuarios autorizados y su rol. Lista TOTALMENTE independiente de la de
-- Protágoras (app_users) — es gente distinta.
create table if not exists public.ao_app_users (
  email       text primary key,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.ao_app_users enable row level security;

drop policy if exists "ao_app_users read" on public.ao_app_users;
drop policy if exists "ao_app_users insert" on public.ao_app_users;
drop policy if exists "ao_app_users update" on public.ao_app_users;
drop policy if exists "ao_app_users delete" on public.ao_app_users;

create policy "ao_app_users read"   on public.ao_app_users for select using (true);
create policy "ao_app_users insert" on public.ao_app_users for insert with check (true);
create policy "ao_app_users update" on public.ao_app_users for update using (true) with check (true);
create policy "ao_app_users delete" on public.ao_app_users for delete using (true);

-- Semilla: administrador inicial (bootstrap), para poder entrar y añadir al
-- resto de usuarios reales desde "Gestionar usuarios".
insert into public.ao_app_users (email, is_admin) values
  ('juan.sanchez@gibobs.com', true)
on conflict (email) do nothing;

-- Storage: crea el bucket "ao-files" desde el Dashboard (Storage → New bucket
-- → Public = ON) y luego ejecuta estas políticas.
create policy "ao-files public read"   on storage.objects for select using (bucket_id = 'ao-files');
create policy "ao-files public insert" on storage.objects for insert with check (bucket_id = 'ao-files');
create policy "ao-files public update" on storage.objects for update using (bucket_id = 'ao-files') with check (bucket_id = 'ao-files');
create policy "ao-files public delete" on storage.objects for delete using (bucket_id = 'ao-files');
