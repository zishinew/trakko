alter table public.beats add column release_at timestamptz, add column free_download boolean not null default false, add column free_download_terms text not null default 'Non-commercial demo use only. Credit the producer. No distribution, resale, or Content ID registration.';
alter table public.orders add column items jsonb not null default '[]', add column subtotal_cents bigint, add column discount_cents bigint not null default 0 check(discount_cents>=0), add column promotion_code text not null default '', add column bundle_name text not null default '', add column receipt_ciphertext text not null default '', add column source text not null default 'direct';
create table public.store_tools(store_id uuid primary key references public.stores(id) on delete cascade, config jsonb not null default '{"promotions":[],"bundles":[],"collaborators":[]}', updated_at timestamptz not null default now());
create table public.contacts(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,email text not null, marketing_consent boolean not null default false,consent_at timestamptz,beat_id uuid,created_at timestamptz not null default now(),unique(store_id,email));
create table public.store_events(id uuid primary key,store_id uuid not null references public.stores(id) on delete cascade,beat_id uuid,kind text not null check(kind in ('visit','play','checkout','free_download')),source text not null default 'direct',visitor_hash text not null,created_at timestamptz not null default now());
create index store_events_date on public.store_events(store_id,created_at desc);
create index contacts_date on public.contacts(store_id,created_at desc);
create table public.mail_jobs(id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.orders(id) on delete cascade,store_id uuid not null references public.stores(id) on delete cascade,status text not null default 'pending' check(status in ('pending','sending','sent','failed','disabled','demo')),attempts integer not null default 0,last_error text not null default '',created_at timestamptz not null default now(),sent_at timestamptz,locked_at timestamptz);
create index mail_jobs_queue on public.mail_jobs(status,created_at);
alter table public.store_tools enable row level security;
alter table public.contacts enable row level security;
alter table public.store_events enable row level security;
alter table public.mail_jobs enable row level security;
revoke all on public.store_tools, public.contacts, public.store_events, public.mail_jobs from anon,authenticated;
grant select,insert,update,delete on public.store_tools to authenticated;
grant select on public.contacts,public.store_events,public.mail_jobs to authenticated;
grant all on public.store_tools,public.contacts,public.store_events,public.mail_jobs to service_role;
create policy tools_owner on public.store_tools for all to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid()))) with check(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy contacts_owner on public.contacts for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy events_owner on public.store_events for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy mail_owner on public.mail_jobs for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
drop policy beat_public on public.beats;
create policy beat_public on public.beats for select to anon,authenticated using(published and (release_at is null or release_at<=now()) and exists(select 1 from public.stores s where s.id=store_id and s.published));
-- Queue receipts in the same transaction as payment settlement. Never expose this function to clients.
create function public.queue_paid_receipt() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.status='paid' and (tg_op='INSERT' or old.status is distinct from 'paid') then
 insert into public.mail_jobs(order_id,store_id) values(new.id,new.store_id) on conflict(order_id) do nothing;
 end if; return new; end $$;
revoke all on function public.queue_paid_receipt() from public,anon,authenticated;
create trigger queue_receipt after insert or update of status on public.orders for each row execute function public.queue_paid_receipt();
create function public.claim_receipts(batch_size integer default 10) returns setof public.mail_jobs language sql security invoker set search_path='' as $$
 update public.mail_jobs set status='sending',locked_at=now(),attempts=attempts+1 where id in
 (select id from public.mail_jobs where (status in ('pending','failed') or (status='sending' and locked_at<now()-interval '10 minutes')) and attempts<5 order by created_at for update skip locked limit least(greatest(batch_size,1),50)) returning *;
$$;
revoke all on function public.claim_receipts(integer) from public,anon,authenticated;
grant execute on function public.claim_receipts(integer) to service_role;
