-- All financial and fulfillment writes use the server service role.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.stores (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$' and username not in ('api','dashboard','login','signup','onboarding','reset-password','update-password','auth','purchase','demo','_next')),
 display_name text not null check(length(display_name) between 1 and 60), bio text not null default '' check(length(bio)<=300),
 avatar_url text not null default '', banner_url text not null default '', accent text not null default '#d5ff63' check(accent ~ '^#[0-9a-fA-F]{6}$'),
 theme text not null default 'dark' check(theme in ('dark','light')), instagram text not null default '', youtube text not null default '', website text not null default '',
 published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.beats (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 title text not null check(length(title) between 1 and 100), bpm integer not null check(bpm between 30 and 300), musical_key text not null default '',
 tags text[] not null default '{}', description text not null default '', cover_url text not null default '', preview_url text not null default '',
 published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(store_id,id)
);
create table public.licenses (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 beat_id uuid, name text not null check(length(name) between 1 and 40), price_cents integer not null check(price_cents between 50 and 100000000),
 terms text not null check(length(terms) between 10 and 12000), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(store_id,beat_id) references public.beats(store_id,id) on delete cascade, unique(store_id,id)
);
create table public.license_deliverables (
 license_id uuid not null references public.licenses(id) on delete cascade,
 kind text not null check(kind in ('mp3','wav','stems')), primary key(license_id,kind)
);
create table public.beat_files (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 beat_id uuid not null, kind text not null check(kind in ('mp3','wav','stems','preview','cover')),
 path text not null unique, name text not null, size bigint not null check(size>=0), created_at timestamptz not null default now(),
 foreign key(store_id,beat_id) references public.beats(store_id,id) on delete cascade,
 unique(beat_id,kind)
);
create table public.stripe_accounts (
 store_id uuid primary key references public.stores(id) on delete cascade, account_id text not null unique,
 charges_enabled boolean not null default false, payouts_enabled boolean not null default false, details_submitted boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id),
 beat_id uuid not null, license_id uuid not null, customer_email text not null,
 amount_cents integer not null check(amount_cents>=50), fee_cents integer not null check(fee_cents>=0), earnings_cents integer not null check(earnings_cents>=0),
 currency text not null default 'usd', beat_title text not null, producer_name text not null, license_name text not null, license_terms text not null,
 deliverables text[] not null, files jsonb not null, status text not null default 'pending' check(status in ('pending','paid','refunded')),
 fulfillment_status text not null default 'pending' check(fulfillment_status in ('pending','ready')),
 stripe_session_id text unique, stripe_payment_id text, token_hash text not null unique,
 created_at timestamptz not null default now(), paid_at timestamptz,
 check(amount_cents = fee_cents + earnings_cents),
 check(fulfillment_status <> 'ready' or status = 'paid')
 -- Beat/license IDs are snapshot references: deleting catalog records must not destroy a customer's receipt or entitlement.
);
create table public.play_events (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 beat_id uuid not null references public.beats(id) on delete cascade, visitor_hash text not null, created_at timestamptz not null default now()
);
create table public.upload_intents (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 beat_id uuid, kind text not null, path text not null unique, name text not null, size bigint not null, content_type text not null,
 created_at timestamptz not null default now(), foreign key(store_id,beat_id) references public.beats(store_id,id) on delete cascade
);
create index beats_catalog on public.beats(store_id,published,created_at desc);
create index licenses_store_beat on public.licenses(store_id,beat_id);
create index files_store on public.beat_files(store_id);
create index orders_store_date on public.orders(store_id,created_at desc);
create index orders_payment on public.orders(stripe_payment_id);
create index plays_store_date on public.play_events(store_id,created_at desc);
create index plays_dedup on public.play_events(beat_id,visitor_hash,created_at desc);
create index intents_store on public.upload_intents(store_id);

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.beats enable row level security;
alter table public.licenses enable row level security;
alter table public.license_deliverables enable row level security;
alter table public.beat_files enable row level security;
alter table public.stripe_accounts enable row level security;
alter table public.orders enable row level security;
alter table public.play_events enable row level security;
alter table public.upload_intents enable row level security;

create policy profile_owner on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy store_owner on public.stores for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy store_public on public.stores for select to anon, authenticated using(published);
create policy beat_owner on public.beats for all to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid()))) with check(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy beat_public on public.beats for select to anon, authenticated using(published and exists(select 1 from public.stores s where s.id=store_id and s.published));
create policy license_owner on public.licenses for all to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid()))) with check(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy license_public on public.licenses for select to anon, authenticated using(active and exists(select 1 from public.beats b join public.stores s on s.id=b.store_id where b.id=beat_id and b.published and s.published));
create policy deliverable_owner on public.license_deliverables for all to authenticated using(exists(select 1 from public.licenses l join public.stores s on s.id=l.store_id where l.id=license_id and s.owner_id=(select auth.uid()))) with check(exists(select 1 from public.licenses l join public.stores s on s.id=l.store_id where l.id=license_id and s.owner_id=(select auth.uid())));
create policy deliverable_public on public.license_deliverables for select to anon, authenticated using(exists(select 1 from public.licenses l where l.id=license_id and l.active and l.beat_id is not null));
create policy file_owner on public.beat_files for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy orders_owner on public.orders for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy stripe_owner on public.stripe_accounts for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
create policy plays_owner on public.play_events for select to authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.owner_id=(select auth.uid())));
-- Upload intents have no client policies; server exclusively allocates and finalizes paths.
revoke all on public.profiles, public.stores, public.beats, public.licenses, public.license_deliverables, public.beat_files, public.orders, public.stripe_accounts, public.play_events, public.upload_intents from anon, authenticated;
grant select on public.stores, public.beats, public.licenses, public.license_deliverables to anon;
grant select,insert,update,delete on public.profiles, public.stores, public.beats, public.licenses, public.license_deliverables to authenticated;
grant select on public.beat_files, public.orders, public.stripe_accounts, public.play_events to authenticated;
grant all on all tables in schema public to service_role;

create function public.save_license(payload jsonb, included text[]) returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into public.licenses(id,store_id,beat_id,name,price_cents,terms,active)
 values((payload->>'id')::uuid,(payload->>'store_id')::uuid,(payload->>'beat_id')::uuid,payload->>'name',(payload->>'price_cents')::integer,payload->>'terms',(payload->>'active')::boolean)
 on conflict(id) do update set name=excluded.name, price_cents=excluded.price_cents, terms=excluded.terms, active=excluded.active;
 delete from public.license_deliverables where license_id=(payload->>'id')::uuid;
 insert into public.license_deliverables(license_id,kind) select (payload->>'id')::uuid,unnest(included);
end $$;
revoke all on function public.save_license(jsonb,text[]) from public,anon;
grant execute on function public.save_license(jsonb,text[]) to authenticated,service_role;

create function public.touch_updated_at() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
revoke all on function public.touch_updated_at() from public,anon,authenticated;
create trigger store_updated before update on public.stores for each row execute function public.touch_updated_at();
create trigger beat_updated before update on public.beats for each row execute function public.touch_updated_at();
create trigger license_updated before update on public.licenses for each row execute function public.touch_updated_at();
create trigger stripe_updated before update on public.stripe_accounts for each row execute function public.touch_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('preview-assets','preview-assets',true,31457280,array['audio/mpeg','audio/mp3','image/jpeg','image/png','image/webp']),
 ('beat-deliverables','beat-deliverables',false,1073741824,array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','application/zip','application/x-zip-compressed'])
 on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No anon/authenticated policies for private objects. Server issues signed uploads/downloads
-- after ownership or completed-purchase authorization. Public bucket serves previews only.

-- Aggregate in PostgreSQL instead of transferring play histories to the browser.
-- SECURITY INVOKER preserves producer RLS; other producers get no matching rows.
create function public.store_play_counts(target_store uuid)
returns table(total bigint, week bigint, month bigint)
language sql stable security invoker set search_path='' as $$
 select count(*), count(*) filter(where created_at >= now()-interval '7 days'), count(*) filter(where created_at >= now()-interval '30 days')
 from public.play_events where store_id=target_store
$$;
revoke all on function public.store_play_counts(uuid) from public,anon;
grant execute on function public.store_play_counts(uuid) to authenticated,service_role;

-- Restrictive policy also protects private source files if this project already
-- has a broad permissive storage policy. Signed operations use the service role.
create policy private_deliverables_server_only on storage.objects as restrictive
 for all to anon,authenticated
 using(bucket_id <> 'beat-deliverables')
 with check(bucket_id <> 'beat-deliverables');
