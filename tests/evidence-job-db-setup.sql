-- Only in the disposable database initialized by billing-db-setup.sql.
create or replace function auth.uid() returns uuid language sql as
  'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
grant usage on schema public,auth to authenticated,anon;
create table public.evidence_items (
  id uuid primary key, user_id uuid not null references auth.users(id)
);
create table public.extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id),
  user_id uuid not null references auth.users(id),
  status text not null default 'queued', provider text, error_message text,
  started_at timestamptz, finished_at timestamptz
);
alter table public.evidence_items enable row level security;
alter table public.extraction_jobs enable row level security;
create policy "evidence own read" on public.evidence_items for select
  using (user_id=auth.uid());
grant select on public.evidence_items to authenticated;
grant insert on public.extraction_jobs to authenticated,anon;
