-- Apply after upgrade_billing_foundation.sql; safe to rerun.
begin;
create table if not exists public.usage_reservations (
  request_id uuid primary key,
  user_id uuid not null,
  period_start date not null,
  metric text not null,
  state text not null default 'reserved' check (state in ('reserved', 'committed', 'released')),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  foreign key (user_id, period_start, metric)
    references public.usage_counters(user_id, period_start, metric) on delete cascade
);
alter table public.usage_reservations enable row level security;
revoke all on public.usage_reservations from public, anon, authenticated;
grant select, insert, update on public.usage_reservations to service_role;

create or replace function public.reserve_ai_usage(p_user_id uuid, p_metric text, p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_plan text := 'free';
  v_limit integer;
  v_period date;
  v_used integer;
begin
  if p_user_id is null or p_request_id is null or p_metric is null
    or p_metric not in ('chat_messages', 'contract_analyses', 'evidence_analyses') then
    raise exception 'Invalid AI usage reservation';
  end if;
  if exists (select 1 from public.billing_subscriptions where user_id=p_user_id
    and plan_key='tenant_plus' and status in ('active','trialing')
    and (current_period_end is null or current_period_end > now())) then
    v_plan := 'tenant_plus';
  end if;
  v_limit := case p_metric
    when 'chat_messages' then case when v_plan='tenant_plus' then 50 else 5 end
    when 'contract_analyses' then case when v_plan='tenant_plus' then 10 else 1 end
    else case when v_plan='tenant_plus' then 25 else 2 end end;
  v_period := case when p_metric='chat_messages' then (now() at time zone 'UTC')::date
    else date_trunc('month', now() at time zone 'UTC')::date end;
  insert into public.usage_counters(user_id,period_start,metric,used_count,limit_count)
    values(p_user_id,v_period,p_metric,0,v_limit) on conflict do nothing;
  -- Serialize both admission and settlement on this user's period/metric row.
  select used_count into v_used from public.usage_counters
    where user_id=p_user_id and period_start=v_period and metric=p_metric for update;
  if exists (select 1 from public.usage_reservations where request_id=p_request_id) then
    raise exception 'AI usage request already reserved';
  end if;
  update public.usage_counters set limit_count=v_limit, updated_at=now()
    where user_id=p_user_id and period_start=v_period and metric=p_metric;
  if v_used >= v_limit then
    return jsonb_build_object('allowed',false,'plan',v_plan,'limit',v_limit,'used',v_used);
  end if;
  insert into public.usage_reservations(request_id,user_id,period_start,metric)
    values(p_request_id,p_user_id,v_period,p_metric);
  update public.usage_counters set used_count=used_count+1
    where user_id=p_user_id and period_start=v_period and metric=p_metric;
  return jsonb_build_object('allowed',true,'plan',v_plan,'limit',v_limit,'used',v_used,
    'request_id',p_request_id);
end $$;

create or replace function public.settle_ai_usage(p_request_id uuid, p_succeeded boolean)
returns boolean language plpgsql security invoker set search_path = public as $$
declare v_request public.usage_reservations%rowtype;
begin
  if p_request_id is null or p_succeeded is null then raise exception 'Invalid AI usage settlement'; end if;
  select * into v_request from public.usage_reservations where request_id=p_request_id;
  if not found then raise exception 'Unknown AI usage reservation'; end if;
  perform 1 from public.usage_counters where user_id=v_request.user_id
    and period_start=v_request.period_start and metric=v_request.metric for update;
  select * into v_request from public.usage_reservations where request_id=p_request_id for update;
  if v_request.state <> 'reserved' then return false; end if;
  if not p_succeeded then
    update public.usage_counters set used_count=used_count-1,updated_at=now()
      where user_id=v_request.user_id and period_start=v_request.period_start and metric=v_request.metric;
  end if;
  update public.usage_reservations set state=case when p_succeeded then 'committed' else 'released' end,
    settled_at=now() where request_id=p_request_id;
  return true;
end $$;

revoke all on function public.reserve_ai_usage(uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.settle_ai_usage(uuid,boolean) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid,text,uuid) to service_role;
grant execute on function public.settle_ai_usage(uuid,boolean) to service_role;
comment on table public.usage_reservations is
  'Server-only AI quota reservations. Pending requests occupy quota; never expire automatically after an ambiguous/crashed provider call.';
commit;
