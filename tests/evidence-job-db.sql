insert into auth.users(id) values ('00000000-0000-4000-8000-000000000011'),('00000000-0000-4000-8000-000000000012');
insert into public.evidence_items(id,user_id) values
 ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011'),
 ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000012');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',false);
insert into public.extraction_jobs(evidence_id,user_id) values
 ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011');
do $$ begin
  begin
    insert into public.extraction_jobs(evidence_id,user_id) values
      ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000011');
    raise exception 'Other-user evidence accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.extraction_jobs(evidence_id,user_id) values
      ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000012');
    raise exception 'Forged user accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.extraction_jobs(evidence_id,user_id,status) values
      ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011','succeeded');
    raise exception 'Forged job success accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.extraction_jobs(evidence_id,user_id,provider) values
      ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011','gemini');
    raise exception 'Forged provider accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin
    insert into public.extraction_jobs(evidence_id,user_id) values
      ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011');
    raise exception 'Anonymous job accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.extraction_jobs)<>1 then raise exception 'Unexpected accepted job count'; end if;
end $$;
select 'Owned queued job accepted; cross-user, forged and anonymous inserts blocked' as result;
