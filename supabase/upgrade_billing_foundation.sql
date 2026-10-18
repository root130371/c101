-- C101 billing foundation.
-- Run in Supabase SQL Editor before enabling a real payment processor.

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null default 'free' check (plan_key in ('free', 'tenant_plus')),
  status text not null default 'active' check (
    status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')
  ),
  processor text check (processor in ('iyzico', 'paytr', 'apple', 'google', 'manual')),
  processor_customer_id text,
  processor_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  metric text not null check (
    metric in ('chat_messages', 'contract_analyses', 'evidence_analyses', 'grounded_searches')
  ),
  used_count integer not null default 0 check (used_count >= 0),
  limit_count integer not null check (limit_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start, metric)
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  processor text not null check (processor in ('iyzico', 'paytr', 'apple', 'google', 'manual')),
  event_type text not null,
  processor_event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null default 'tenant_plus' check (plan_key in ('tenant_plus')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled')),
  source text not null default 'app_manual' check (source in ('app_manual', 'apple_pending', 'google_pending', 'web_pending')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_subscriptions_user_status_idx
  on public.billing_subscriptions (user_id, status, created_at desc);

create unique index if not exists billing_events_processor_event_unique_idx
  on public.billing_events (processor, processor_event_id)
  where processor_event_id is not null;

create index if not exists billing_upgrade_requests_user_status_idx
  on public.billing_upgrade_requests (user_id, status, created_at desc);

alter table public.billing_subscriptions enable row level security;
alter table public.usage_counters enable row level security;
alter table public.billing_events enable row level security;
alter table public.billing_upgrade_requests enable row level security;

drop policy if exists "billing subscriptions own read" on public.billing_subscriptions;
create policy "billing subscriptions own read" on public.billing_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "billing subscriptions admin read" on public.billing_subscriptions;
create policy "billing subscriptions admin read" on public.billing_subscriptions
  for select using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists "usage counters own read" on public.usage_counters;
create policy "usage counters own read" on public.usage_counters
  for select using (user_id = auth.uid());

drop policy if exists "usage counters admin read" on public.usage_counters;
create policy "usage counters admin read" on public.usage_counters
  for select using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists "billing events own read" on public.billing_events;
create policy "billing events own read" on public.billing_events
  for select using (user_id = auth.uid());

drop policy if exists "billing events admin read" on public.billing_events;
create policy "billing events admin read" on public.billing_events
  for select using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists "billing upgrade requests own read" on public.billing_upgrade_requests;
create policy "billing upgrade requests own read" on public.billing_upgrade_requests
  for select using (user_id = auth.uid());

drop policy if exists "billing upgrade requests own insert" on public.billing_upgrade_requests;
create policy "billing upgrade requests own insert" on public.billing_upgrade_requests
  for insert with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "billing upgrade requests admin read" on public.billing_upgrade_requests;
create policy "billing upgrade requests admin read" on public.billing_upgrade_requests
  for select using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

comment on table public.billing_subscriptions is
  'Subscription entitlement records. Writes should come from trusted payment webhooks or admin service role.';

comment on table public.usage_counters is
  'Per-user AI/document usage counters used to enforce Free vs Tenant Plus limits.';

comment on table public.billing_events is
  'Raw payment/webhook audit events for reconciliation and support.';

comment on table public.billing_upgrade_requests is
  'User-created Plus upgrade requests. These do not grant access; admins or trusted payment webhooks must create billing_subscriptions.';
