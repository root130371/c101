-- Kiracı Kalkanı v1 backend foundation
-- Run this in Supabase SQL Editor after reviewing the project name/region.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'tenant' check (role in ('tenant', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  city text not null default 'İzmir',
  district text not null default 'Narlıdere',
  neighborhood text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  type text not null check (type in ('bank', 'message', 'photo', 'listing', 'contract')),
  status text not null default 'uploaded' check (status in ('missing', 'uploaded', 'processing', 'available', 'review_required', 'failed')),
  file_bucket text not null default 'evidence',
  file_path text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  confidence numeric(4, 3),
  summary_tr text,
  summary_en text,
  extracted_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'review_required', 'failed')),
  provider text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rent_listings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  rent numeric not null,
  size numeric,
  building_age numeric,
  city text not null default 'İzmir',
  district text not null default 'Narlıdere',
  neighborhood text,
  address text,
  lat numeric,
  lng numeric,
  source text,
  proof text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'tenant')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.evidence_items enable row level security;
alter table public.extraction_jobs enable row level security;
alter table public.rent_listings enable row level security;
alter table public.assistant_messages enable row level security;

create policy "profiles own read" on public.profiles
  for select using (id = auth.uid());

create policy "properties own all" on public.properties
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "evidence own all" on public.evidence_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "extraction own read" on public.extraction_jobs
  for select using (user_id = auth.uid());

create policy "extraction own insert" on public.extraction_jobs
  for insert with check (user_id = auth.uid());

create policy "assistant own all" on public.assistant_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "rent listings public read" on public.rent_listings
  for select using (true);

create policy "rent listings admin write" on public.rent_listings
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "evidence files own read" on storage.objects
  for select using (bucket_id = 'evidence' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "evidence files own insert" on storage.objects
  for insert with check (bucket_id = 'evidence' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "evidence files own update" on storage.objects
  for update using (bucket_id = 'evidence' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "evidence files own delete" on storage.objects
  for delete using (bucket_id = 'evidence' and auth.uid()::text = (storage.foldername(name))[1]);
