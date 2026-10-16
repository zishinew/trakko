import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomUUID } from 'node:crypto';
import { demoMode } from './config';
import { demoSession, mutateDemo } from './demo';
import { supabaseAdmin } from './supabase/server';
import { emptyTools, toolsSchema, type ProducerTools, type StoreEvent } from './tools';
export async function getTools(storeId: string): Promise<ProducerTools> {
  const { data, error } = await supabaseAdmin()
    .from('store_tools')
    .select('config')
    .eq('store_id', storeId)
    .maybeSingle();
  if (error) throw error;
  return data ? toolsSchema.parse(data.config) : emptyTools();
}
export function safeSource(value: string | null | undefined) {
  const source = (value || 'direct').trim().slice(0, 100);
  return /^[a-zA-Z0-9_. -]+$/.test(source) ? source : 'direct';
}
export async function recordEvent(
  storeId: string,
  kind: StoreEvent['kind'],
  source: string,
  beatId: string | null = null,
) {
  const jar = await cookies();
  let visitor = jar.get('offgrid_visitor')?.value;
  if (!visitor || !/^[0-9a-f-]{36}$/.test(visitor)) {
    visitor = randomUUID();
    jar.set('offgrid_visitor', visitor, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 86400 * 30,
    });
  }
  const hash = createHash('sha256').update(visitor).digest('hex');
  const key = createHash('sha256')
    .update(`${storeId}:${hash}:${kind}:${beatId || ''}:${Math.floor(Date.now() / 1800000)}`)
    .digest('hex')
    .slice(0, 32);
  const id = `${key.slice(0, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}-${key.slice(16, 20)}-${key.slice(20)}`;
  const event: StoreEvent = {
    id,
    store_id: storeId,
    kind,
    source: safeSource(source),
    beat_id: beatId,
    visitor_hash: hash,
    created_at: new Date().toISOString(),
  };
  if (demoMode)
    await mutateDemo(await demoSession(true), (s) => {
      s.events ||= [];
      if (!s.events.some((e) => e.id === id)) s.events.push(event);
    });
  else {
    const { error } = await supabaseAdmin()
      .from('store_events')
      .upsert(event, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }
}
export const csvCell = (value: unknown) =>
  `"${String(value ?? '')
    .replace(/^[=+@-]/, "'$&")
    .replaceAll('"', '""')}"`;
