-- Dedicated fixtures; run after the billing regression checks.
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000003');
set role service_role;
do $$ declare r jsonb; n integer; id uuid; begin
  for n in 1..5 loop
    id:=gen_random_uuid();
    r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','chat_messages',id);
    if not (r->>'allowed')::boolean then raise exception 'Free allowance rejected early'; end if;
    if n=1 then
      if not public.settle_ai_usage(id,true) then raise exception 'Commit failed'; end if;
      if public.settle_ai_usage(id,false) then raise exception 'Committed request refunded'; end if;
    end if;
  end loop;
  r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','chat_messages',gen_random_uuid());
  if (r->>'allowed')::boolean then raise exception 'Free cap exceeded'; end if;
  if not public.settle_ai_usage(id,false) then raise exception 'Release failed'; end if;
  if public.settle_ai_usage(id,false) then raise exception 'Double refund'; end if;
  r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','chat_messages',gen_random_uuid());
  if not (r->>'allowed')::boolean then raise exception 'Released allowance unavailable'; end if;
  begin
    perform public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','chat_messages',(r->>'request_id')::uuid);
    raise exception 'Duplicate reservation accepted';
  exception when raise_exception then
    if sqlerrm <> 'AI usage request already reserved' then raise; end if;
  end;
  r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','contract_analyses',gen_random_uuid());
  if not (r->>'allowed')::boolean then raise exception 'Independent metric blocked'; end if;
  r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','contract_analyses',gen_random_uuid());
  if (r->>'allowed')::boolean then raise exception 'Contract cap exceeded'; end if;
end $$;
reset role;
-- Entitlement expiry is checked in the same server transaction as admission.
insert into public.billing_subscriptions(user_id,plan_key,status,processor,current_period_end)
values ('00000000-0000-4000-8000-000000000003','tenant_plus','active','manual',now()-interval '1 minute');
do $$ declare r jsonb; begin
  r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','chat_messages',gen_random_uuid());
  if r->>'plan'<>'free' or (r->>'allowed')::boolean then raise exception 'Expired Plus granted'; end if;
  update public.billing_subscriptions set current_period_end=now()+interval '1 day'
    where user_id='00000000-0000-4000-8000-000000000003';
  r:=public.reserve_ai_usage('00000000-0000-4000-8000-000000000003','chat_messages',gen_random_uuid());
  if r->>'plan'<>'tenant_plus' or not (r->>'allowed')::boolean then raise exception 'Active Plus not granted'; end if;
  if exists(select 1 from public.usage_reservations where metric='chat_messages'
    and period_start<>(now() at time zone 'UTC')::date) then raise exception 'Daily period incorrect'; end if;
  if exists(select 1 from public.usage_reservations where metric='contract_analyses'
    and period_start<>date_trunc('month',now() at time zone 'UTC')::date) then raise exception 'Monthly period incorrect'; end if;
  if has_function_privilege('anon','public.reserve_ai_usage(uuid,text,uuid)','execute')
    or has_function_privilege('authenticated','public.reserve_ai_usage(uuid,text,uuid)','execute')
    or has_function_privilege('authenticated','public.settle_ai_usage(uuid,boolean)','execute')
    or has_table_privilege('authenticated','public.usage_reservations','insert') then
    raise exception 'Client can alter usage';
  end if;
end $$;
select 'Atomic usage migration and settlement checks passed' as result;
