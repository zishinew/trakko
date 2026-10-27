-- Supabase may install this event-trigger helper in fresh cloud projects.
-- It must not be callable through the public RPC API. Event triggers continue
-- to run as their owner; local projects without the helper need no change.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- Cover foreign-key checks and owner-scoped lookups without changing access.
create index beat_files_store_beat on public.beat_files(store_id, beat_id);
create index upload_intents_store_beat on public.upload_intents(store_id, beat_id);
create index mail_jobs_store on public.mail_jobs(store_id);
