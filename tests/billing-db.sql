-- Run only in the isolated test database initialized by billing-db-setup.sql.
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001');
insert into public.billing_subscriptions(user_id, plan_key, status, processor)
values ('00000000-0000-4000-8000-000000000001', 'tenant_plus', 'active', 'manual');

set role service_role;
select public.sync_revenuecat_entitlement('00000000-0000-4000-8000-000000000001', true, 'google', now()+interval '1 day', now()-interval '2 minutes', 'purchase');
select public.sync_revenuecat_entitlement('00000000-0000-4000-8000-000000000001', true, 'google', now()+interval '1 day', now()-interval '2 minutes', 'purchase');
select public.sync_revenuecat_entitlement('00000000-0000-4000-8000-000000000001', false, 'google', now()-interval '1 minute', now()-interval '1 minute', 'expiry');
-- Older active result must not reinstate access after newer expiration.
select public.sync_revenuecat_entitlement('00000000-0000-4000-8000-000000000001', true, 'google', now()+interval '1 day', now()-interval '2 minutes', 'stale-purchase');
reset role;

do $$ begin
  if (select count(*) from public.billing_subscriptions) <> 2 then raise exception 'Provider row not idempotent'; end if;
  if (select count(*) from public.billing_events where processor_event_id like 'rc:purchase:%') <> 1 then raise exception 'Duplicate audit event'; end if;
  if (select status from public.billing_subscriptions where revenuecat_user_id is not null) <> 'canceled' then raise exception 'Stale grant overwrote expiration'; end if;
  if not exists (select 1 from public.billing_subscriptions where processor='manual' and status='active') then raise exception 'Manual access changed'; end if;
  if has_function_privilege('authenticated', 'public.sync_revenuecat_entitlement(uuid,boolean,text,timestamptz,timestamptz,text)', 'execute') then raise exception 'Client can invoke service function'; end if;
  if has_function_privilege('anon', 'public.sync_revenuecat_entitlement(uuid,boolean,text,timestamptz,timestamptz,text)', 'execute') then raise exception 'Anonymous can invoke service function'; end if;
end $$;

-- Current provider truth can reactivate the same row after renewal.
select public.sync_revenuecat_entitlement('00000000-0000-4000-8000-000000000001', true, 'google', now()+interval '1 day', now(), 'renewal');
do $$ begin
  if (select status from public.billing_subscriptions where revenuecat_user_id is not null) <> 'active' then raise exception 'Renewal did not reactivate'; end if;
  begin
    perform public.sync_revenuecat_entitlement('00000000-0000-4000-8000-000000000001', true, 'google', now()-interval '1 minute', now(), 'invalid');
    raise exception 'Expired active grant accepted';
  exception when raise_exception then
    if sqlerrm <> 'Invalid RevenueCat entitlement snapshot' then raise; end if;
  end;
end $$;
select 'Billing migration, permissions, duplicate events, stale snapshots, expiry, manual access and renewal checks passed' as result;
