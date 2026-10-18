-- Apply AFTER upgrade_billing_foundation.sql. Safe to re-run.
begin;
alter table public.billing_subscriptions
  add column if not exists revenuecat_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists revenuecat_checked_at timestamptz;
create unique index if not exists billing_subscriptions_revenuecat_user_idx
  on public.billing_subscriptions(revenuecat_user_id);

-- One provider-owned row per user. Other/manual subscriptions remain independent.
-- The service role is the ONLY caller; a client cannot grant itself Plus.
create or replace function public.sync_revenuecat_entitlement(
  p_user_id uuid, p_active boolean, p_processor text, p_period_end timestamptz,
  p_checked_at timestamptz, p_event_id text default null
) returns boolean language plpgsql security invoker set search_path = public as $$
begin
  if p_processor is null or p_processor not in ('apple', 'google', 'manual') or p_checked_at is null
    or p_active is null or p_checked_at > now() + interval '5 minutes'
    or (p_active and (p_processor = 'manual' or p_period_end is null or p_period_end <= now())) then
    raise exception 'Invalid RevenueCat entitlement snapshot';
  end if;
  -- A removed Supabase account must not cause endless webhook retries.
  if not exists (select 1 from auth.users where id = p_user_id) then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if p_event_id is not null then
    insert into public.billing_events(user_id, processor, event_type, processor_event_id, payload)
      values(p_user_id, p_processor, 'revenuecat_sync', 'rc:' || p_event_id || ':' || p_user_id::text,
        jsonb_build_object('active', p_active, 'checked_at', p_checked_at))
      on conflict (processor, processor_event_id) where processor_event_id is not null do nothing;
    -- Audit duplicates are harmless. Still reconcile current provider truth on retries.
  end if;
  insert into public.billing_subscriptions(user_id, revenuecat_user_id, revenuecat_checked_at,
    plan_key, status, processor, processor_customer_id, current_period_end)
    values(p_user_id, p_user_id, p_checked_at, 'tenant_plus',
      case when p_active then 'active' else 'canceled' end, p_processor, p_user_id::text, p_period_end)
    on conflict (revenuecat_user_id) do update set
      revenuecat_checked_at = excluded.revenuecat_checked_at,
      status = excluded.status, processor = excluded.processor,
      current_period_end = excluded.current_period_end, updated_at = now()
    where billing_subscriptions.revenuecat_checked_at < excluded.revenuecat_checked_at;
  return (select status = 'active' and current_period_end > now()
    from public.billing_subscriptions where revenuecat_user_id = p_user_id);
end;
$$;
revoke all on function public.sync_revenuecat_entitlement(uuid, boolean, text, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.sync_revenuecat_entitlement(uuid, boolean, text, timestamptz, timestamptz, text) to service_role;
commit;
