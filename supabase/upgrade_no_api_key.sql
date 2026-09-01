-- Run this once after the original schema.sql if it was already applied.
-- It enables frontend creation of queued extraction jobs and shows how to
-- promote your own signed-up user to admin for rent listing management.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'extraction_jobs'
      and policyname = 'extraction own insert'
  ) then
    create policy "extraction own insert" on public.extraction_jobs
      for insert with check (user_id = auth.uid());
  end if;
end;
$$;

-- After you sign up in the app, replace the email below and run this line
-- in Supabase SQL Editor to make that account a real admin:
--
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-email@example.com';
