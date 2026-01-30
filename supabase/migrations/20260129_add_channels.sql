-- Channels table
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  owner_uid text not null references public.users(uid) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  cover_media_id uuid references public.media(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure unique slugs per owner
create unique index if not exists channels_owner_slug_idx
  on public.channels(owner_uid, slug);

-- Optional channel on article
alter table public.article
  add column if not exists channel_id uuid references public.channels(id) on delete set null;

-- Optional channel on sketch (for interactives)
alter table public.sketch
  add column if not exists channel_id uuid references public.channels(id) on delete set null;
