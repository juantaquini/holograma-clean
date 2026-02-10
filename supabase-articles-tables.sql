-- =============================================
-- Tablas para Articles (Supabase SQL Editor)
-- =============================================
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New query
-- Asume que ya existe la tabla "media" con columna "id" (tipo uuid o bigint).
-- Si tu tabla media usa "id" como bigint, cambia media_id en article_media a bigint.
-- =============================================

-- 1) Tabla principal de artículos
create table if not exists public.article (
  id bigserial primary key,
  title text not null,
  artist text,
  content text default '',
  author_uid text not null,
  channel_id uuid references public.channels (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Si la tabla article ya existía sin channel_id, ejecutá solo esto:
-- alter table public.article add column if not exists channel_id uuid references public.channels (id) on delete set null;
-- create index if not exists idx_article_channel_id on public.article (channel_id);

-- Índices útiles
create index if not exists idx_article_author_uid on public.article (author_uid);
create index if not exists idx_article_created_at on public.article (created_at desc);

-- 2) Tabla de relación artículo ↔ media (orden por position)
create table if not exists public.article_media (
  article_id bigint not null references public.article (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  position int not null default 0,
  primary key (article_id, media_id)
);

-- Índice para listar media de un artículo ordenado
create index if not exists idx_article_media_article_position on public.article_media (article_id, position);
create index if not exists idx_article_channel_id on public.article (channel_id);

-- =============================================
-- RLS (Row Level Security) – opcional
-- =============================================
alter table public.article enable row level security;
alter table public.article_media enable row level security;

-- Políticas: lectura pública, escritura solo autenticados (ajusta a tu auth)
create policy "article_select" on public.article for select using (true);
create policy "article_insert" on public.article for insert with check (true);
create policy "article_update" on public.article for update using (true);
create policy "article_delete" on public.article for delete using (true);

create policy "article_media_select" on public.article_media for select using (true);
create policy "article_media_insert" on public.article_media for insert with check (true);
create policy "article_media_update" on public.article_media for update using (true);
create policy "article_media_delete" on public.article_media for delete using (true);

-- =============================================
-- NOTA: Si tu tabla "media" tiene "id" como bigint
-- en lugar de uuid, ejecuta esto en vez de article_media:
-- =============================================
/*
create table if not exists public.article_media (
  article_id bigint not null references public.article (id) on delete cascade,
  media_id bigint not null references public.media (id) on delete cascade,
  position int not null default 0,
  primary key (article_id, media_id)
);
*/
