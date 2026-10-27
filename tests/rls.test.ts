import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
const alice = 'a0000000-0000-4000-8000-000000000001',
  bob = 'b0000000-0000-4000-8000-000000000001';
const sa = 'a1000000-0000-4000-8000-000000000001',
  sb = 'b1000000-0000-4000-8000-000000000001';
const ba = 'a2000000-0000-4000-8000-000000000001',
  bb = 'b2000000-0000-4000-8000-000000000001';
const la = 'a3000000-0000-4000-8000-000000000001';
test('migration, RLS ownership, private data, and atomic webhook fulfillment in PostgreSQL', async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role;grant all on storage.objects to anon,authenticated,service_role;
 create policy existing_broad_policy on storage.objects for all to anon,authenticated using(true) with check(true);
 insert into storage.objects values('preview-assets','preview.mp3'),('beat-deliverables','private.mp3');`);
  for (const migration of (await readdir('supabase/migrations'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    await db.exec(await readFile(`supabase/migrations/${migration}`, 'utf8'));
  }
  await db.exec(`insert into auth.users values('${alice}'),('${bob}');
 insert into public.stores(id,owner_id,username,display_name) values('${sa}','${alice}','alice','Alice'),('${sb}','${bob}','bob','Bob');
 insert into public.beats(id,store_id,title,bpm,published) values('${ba}','${sa}','Public',140,true),('${bb}','${sb}','Private',120,false);
 insert into public.licenses(id,store_id,beat_id,name,price_cents,terms) values('${la}','${sa}','${ba}','MP3',1999,'Non-exclusive original terms');
 insert into public.license_deliverables values('${la}','mp3');
 insert into public.beat_files(store_id,beat_id,kind,path,name,size) values('${sa}','${ba}','mp3','private/source.mp3','source.mp3',100);
 insert into public.stripe_accounts(store_id,account_id) values('${sa}','acct_secret');
 insert into public.orders(id,store_id,beat_id,license_id,customer_email,amount_cents,fee_cents,earnings_cents,beat_title,producer_name,license_name,license_terms,deliverables,files,token_hash) values('c0000000-0000-4000-8000-000000000001','${sa}','${ba}','${la}','buyer@example.com',1999,200,1799,'Public','Alice','MP3','Original terms',array['mp3'],'[]','hash');`);
  await t.test(
    'public sees only published catalog and never private objects or orders',
    async () => {
      await db.exec('set role anon');
      assert.equal((await db.query('select * from public.beats')).rows.length, 1);
      assert.equal((await db.query('select * from storage.objects')).rows.length, 1);
      await assert.rejects(
        db.query("insert into storage.objects values('beat-deliverables','stolen.mp3')"),
        /row-level security/,
      );
      assert.equal((await db.query('select * from public.license_deliverables')).rows.length, 1);
      for (const table of ['beat_files', 'orders', 'stripe_accounts', 'upload_intents'])
        await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
      await assert.rejects(
        db.query(`update public.beats set title='Stolen' where id='${ba}'`),
        /permission denied/,
      );
      await db.exec('reset role');
    },
  );
  await t.test('Bob cannot edit Alice or read her private rows, even with Alice IDs', async () => {
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${bob}',false)`,
    );
    assert.equal((await db.query('select * from public.beat_files')).rows.length, 0);
    assert.equal((await db.query('select * from public.orders')).rows.length, 0);
    assert.equal(
      (await db.query(`update public.beats set title='Stolen' where id='${ba}' returning id`)).rows
        .length,
      0,
    );
    await assert.rejects(
      db.query(`insert into public.beats(store_id,title,bpm) values('${sa}','Hijacked',100)`),
      /row-level security/,
    );
    await assert.rejects(
      db.query(
        `select public.save_license('{"id":"${la}","store_id":"${sa}","beat_id":"${ba}","name":"Stolen","price_cents":50,"terms":"Stolen terms content","active":true}',array['stems'])`,
      ),
      /row-level security/,
    );
    await db.exec('reset role');
  });
  await t.test(
    'Alice can manage her catalog, but cannot forge payment status or Stripe account',
    async () => {
      await db.exec(
        `set role authenticated; select set_config('request.jwt.claim.sub','${alice}',false)`,
      );
      assert.equal((await db.query('select * from public.beat_files')).rows.length, 1);
      assert.equal(
        (await db.query(`update public.beats set title='Updated' where id='${ba}' returning id`))
          .rows.length,
        1,
      );
      await assert.rejects(db.query(`update public.orders set status='paid'`), /permission denied/);
      await assert.rejects(
        db.query(`update public.stripe_accounts set charges_enabled=true`),
        /permission denied/,
      );
      await assert.rejects(
        db.query(`update public.stores set owner_id='${bob}' where id='${sa}'`),
        /row-level security/,
      );
      await assert.rejects(
        db.query(
          `insert into public.licenses(store_id,beat_id,name,price_cents,terms) values('${sa}','${bb}','Wrong store',1999,'More than ten chars')`,
        ),
        /foreign key/,
      );
      await db.exec('reset role');
    },
  );
  await t.test(
    'growth tools protect contacts, source events and email jobs; scheduled releases are private',
    async () => {
      await db.exec(`insert into public.store_tools(store_id) values('${sa}');
    insert into public.contacts(store_id,email,marketing_consent) values('${sa}','private@example.com',true);
    insert into public.store_events(id,store_id,kind,visitor_hash) values('d0000000-0000-4000-8000-000000000001','${sa}','visit','hashed');
    insert into public.beats(store_id,title,bpm,published,release_at) values('${sa}','Tomorrow',140,true,now()+interval '1 day');`);
      await db.exec('set role anon');
      assert.equal(
        (await db.query(`select * from public.beats where title='Tomorrow'`)).rows.length,
        0,
      );
      for (const table of ['contacts', 'store_tools', 'store_events', 'mail_jobs'])
        await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
      await db.exec(
        `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${bob}',false)`,
      );
      for (const table of ['contacts', 'store_tools', 'store_events', 'mail_jobs'])
        assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0);
      await assert.rejects(
        db.query(
          `insert into public.store_tools(store_id) values('${sa}') on conflict(store_id) do update set config='{}'`,
        ),
        /row-level security/,
      );
      await db.exec(`select set_config('request.jwt.claim.sub','${alice}',false)`);
      assert.equal((await db.query('select * from public.contacts')).rows.length, 1);
      await assert.rejects(
        db.query(`update public.store_tools set store_id='${sb}' where store_id='${sa}'`),
        /row-level security/,
      );
      await assert.rejects(
        db.query(`update public.contacts set marketing_consent=true`),
        /permission denied/,
      );
      await assert.rejects(
        db.query('select * from public.claim_receipts(10)'),
        /permission denied/,
      );
      await db.exec('reset role');
    },
  );
  await t.test(
    'webhook compare-and-set is idempotent and preserves purchased snapshots',
    async () => {
      await db.exec('set role service_role');
      const sql =
        "update public.orders set status='paid',fulfillment_status='ready',paid_at=now() where status='pending' returning id";
      assert.equal((await db.query(sql)).rows.length, 1);
      assert.equal((await db.query(sql)).rows.length, 0);
      assert.equal((await db.query('select * from public.mail_jobs')).rows.length, 1);
      assert.equal((await db.query('select * from public.claim_receipts(10)')).rows.length, 1);
      assert.equal((await db.query('select * from public.claim_receipts(10)')).rows.length, 0);
      await db.exec(`delete from public.beats where id='${ba}'`);
      const result = await db.query<{ license_terms: string; amount_cents: number }>(
        'select license_terms,amount_cents from public.orders',
      );
      assert.equal(result.rows[0].license_terms, 'Original terms');
      assert.equal(result.rows[0].amount_cents, 1999);
      await db.exec('reset role');
    },
  );
  await db.close();
});
