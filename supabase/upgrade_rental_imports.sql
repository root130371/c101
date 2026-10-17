-- Run this once if the original schema.sql was already applied before
-- the rental import queue was added.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'tenant' check (role in ('tenant', 'admin')),
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

alter table public.profiles enable row level security;
alter table public.rent_listings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles own read'
  ) then
    create policy "profiles own read" on public.profiles
      for select using (id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rent_listings'
      and policyname = 'rent listings public read'
  ) then
    create policy "rent listings public read" on public.rent_listings
      for select using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rent_listings'
      and policyname = 'rent listings admin write'
  ) then
    create policy "rent listings admin write" on public.rent_listings
      for all using (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      ) with check (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      );
  end if;
end;
$$;

create table if not exists public.rental_imports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  title text not null,
  rent numeric not null,
  size numeric,
  building_age numeric,
  rooms text,
  floor text,
  heating text,
  deposit numeric,
  city text not null default 'İzmir',
  district text not null default 'Narlıdere',
  neighborhood text,
  address text,
  lat numeric,
  lng numeric,
  source text,
  source_url text,
  proof text,
  description text,
  image_urls text[] not null default '{}'::text[],
  raw_json jsonb not null default '{}'::jsonb,
  approved_listing_id uuid references public.rent_listings(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_imports enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rental_imports'
      and policyname = 'rental imports admin all'
  ) then
    create policy "rental imports admin all" on public.rental_imports
      for all using (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      ) with check (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      );
  end if;
end;
$$;

create index if not exists rental_imports_status_created_at_idx
  on public.rental_imports (status, created_at desc);

create index if not exists rental_imports_source_url_idx
  on public.rental_imports (source_url);

create unique index if not exists rental_imports_source_url_unique_idx
  on public.rental_imports (source_url)
  where source_url is not null;
