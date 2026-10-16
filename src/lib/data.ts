import 'server-only';
import { cache } from 'react';
import { fetchAll } from './pagination';
import { redirect } from 'next/navigation';
import { emptyTools, isBeatLive, publicTools } from './tools';
import { getTools } from './tools-server';
import { demoMode, configured } from './config';
import { demoSession, readDemo } from './demo';
import { supabaseServer, supabaseAdmin } from './supabase/server';
import type { License, Workspace, PublicCatalog, Deliverable } from './types';
export async function producer() {
  if (!configured) throw new Error('Authentication is not configured');
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error('Please log in');
  return { db, user };
}
export async function ownedStore() {
  const { db, user } = await producer();
  const { data: store, error } = await db
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!store) throw new Error('Create your store first');
  return { db, user, store };
}
export async function hydrateLicenses(
  storeId: string,
  db: Awaited<ReturnType<typeof supabaseServer>>,
): Promise<License[]> {
  const data = await fetchAll((from, to) =>
    db.from('licenses').select('*').eq('store_id', storeId).order('id').range(from, to),
  );
  const ids = (data || []).map((l) => l.id);
  if (!ids.length) return [];
  const includes: { license_id: string; kind: Deliverable }[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data: batch, error } = await db
      .from('license_deliverables')
      .select('*')
      .in('license_id', ids.slice(offset, offset + 100));
    if (error) throw error;
    includes.push(...(batch || []));
  }
  return (data || []).map((l) => ({
    ...l,
    deliverables: (includes || []).filter((d) => d.license_id === l.id).map((d) => d.kind),
  }));
}
export const workspace = cache(async function workspace(): Promise<Workspace> {
  if (demoMode) {
    const state = await readDemo(await demoSession());
    return {
      ...state,
      as_of: new Date().toISOString(),
      play_counts: {
        all: state.plays.length,
        week: state.plays.filter((p) => Date.parse(p.created_at) > Date.now() - 7 * 86400000)
          .length,
        month: state.plays.filter((p) => Date.parse(p.created_at) > Date.now() - 30 * 86400000)
          .length,
      },
    };
  }
  let ctx;
  try {
    ctx = await ownedStore();
  } catch (e) {
    if ((e as Error).message === 'Create your store first') redirect('/onboarding');
    if ((e as Error).message === 'Please log in' || !configured) redirect('/login');
    throw e;
  }
  const { db, store } = ctx;
  const [beats, licenses, files, orders, metrics, stripe, tools, contacts, events, mailJobs] =
    await Promise.all([
      fetchAll((from, to) =>
        db
          .from('beats')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, to),
      ),
      hydrateLicenses(store.id, db),
      fetchAll((from, to) =>
        db.from('beat_files').select('*').eq('store_id', store.id).order('id').range(from, to),
      ),
      fetchAll((from, to) =>
        db
          .from('orders')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, to),
      ),
      db.rpc('store_play_counts', { target_store: store.id }),
      db.from('stripe_accounts').select('*').eq('store_id', store.id).maybeSingle(),
      getTools(store.id),
      fetchAll((from, to) =>
        db.from('contacts').select('*').eq('store_id', store.id).order('id').range(from, to),
      ),
      fetchAll((from, to) =>
        db
          .from('store_events')
          .select('*')
          .eq('store_id', store.id)
          .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
          .order('id')
          .range(from, to),
      ),
      fetchAll((from, to) =>
        db.from('mail_jobs').select('*').eq('store_id', store.id).order('id').range(from, to),
      ),
    ]);
  if (metrics.error) throw metrics.error;
  if (stripe.error) throw stripe.error;
  const counts = metrics.data?.[0];
  return {
    as_of: new Date().toISOString(),
    store,
    beats,
    licenses,
    files,
    orders,
    plays: [],
    play_counts: counts
      ? { all: Number(counts.total), week: Number(counts.week), month: Number(counts.month) }
      : { all: 0, week: 0, month: 0 },
    stripe: stripe.data,
    tools,
    contacts,
    events,
    mail_jobs: mailJobs,
  };
});
export async function catalog(username: string): Promise<PublicCatalog | null> {
  if (demoMode) {
    const state = await readDemo(await demoSession());
    if (username !== state.store.username || !state.store.published) return null;
    return {
      store: state.store,
      beats: state.beats.filter((b) => isBeatLive(b)),
      tools: publicTools(
        state.tools || emptyTools(),
        state.beats.filter((b) => isBeatLive(b)).map((b) => b.id),
      ),
      licenses: state.licenses.filter(
        (l) => l.active && state.beats.some((b) => b.id === l.beat_id && isBeatLive(b)),
      ),
    };
  }
  if (!configured) return null;
  const db = await supabaseServer();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('*')
    .eq('username', username)
    .eq('published', true)
    .maybeSingle();
  if (storeError) throw storeError;
  if (!store) return null;
  const beats = await fetchAll((from, to) =>
    db
      .from('beats')
      .select('*')
      .eq('store_id', store.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to),
  );
  const licenses = await hydrateLicenses(store.id, db);
  return {
    store,
    beats: (beats || []).filter((b) => isBeatLive(b)),
    tools: publicTools(
      await getTools(store.id),
      (beats || []).filter((b) => isBeatLive(b)).map((b) => b.id),
    ),
    licenses: licenses.filter(
      (l) => l.active && (beats || []).some((b) => b.id === l.beat_id && isBeatLive(b)),
    ),
  };
}
export async function checkoutCatalog(beatId: string) {
  const db = supabaseAdmin();
  const { data: beat } = await db
    .from('beats')
    .select('*')
    .eq('id', beatId)
    .eq('published', true)
    .single();
  if (!beat || !isBeatLive(beat)) throw new Error('Beat unavailable');
  const { data: store } = await db
    .from('stores')
    .select('*')
    .eq('id', beat.store_id)
    .eq('published', true)
    .single();
  if (!store) throw new Error('Store unavailable');
  const licenses = await hydrateLicenses(store.id, db);
  const { data: files, error } = await db.from('beat_files').select('*').eq('beat_id', beat.id);
  if (error) throw error;
  return { db, beat, store, licenses, files: files || [] };
}
