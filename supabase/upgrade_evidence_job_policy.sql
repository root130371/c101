-- Existing deployments may only have the extraction-job SELECT policy.
-- The mobile upload/retry flow needs INSERT, limited to owned evidence.
begin;
drop policy if exists "extraction own insert" on public.extraction_jobs;
create policy "extraction own insert" on public.extraction_jobs
  for insert to authenticated with check (
    user_id = auth.uid()
    and status = 'queued'
    and provider is null and error_message is null
    and started_at is null and finished_at is null
    and exists (
      select 1 from public.evidence_items e
      where e.id = evidence_id and e.user_id = auth.uid()
    )
  );
commit;
