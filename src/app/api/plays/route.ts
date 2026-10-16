import { createHash, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { isBeatLive } from '@/lib/tools';
import { recordEvent } from '@/lib/tools-server';
import { assertOrigin, apiError } from '@/lib/http';
import { demoMode } from '@/lib/config';
import { demoSession, mutateDemo } from '@/lib/demo';
import { supabaseAdmin } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { beat_id } = z.object({ beat_id: z.uuid() }).parse(await request.json());
    let storeId = '';
    if (demoMode) {
      await mutateDemo(await demoSession(true), (state) => {
        if (!state.beats.some((b) => b.id === beat_id && isBeatLive(b)))
          throw new Error('Beat unavailable');
        storeId = state.store.id;
        if (
          !state.plays.some(
            (p) => p.beat_id === beat_id && Date.parse(p.created_at) > Date.now() - 60000,
          )
        )
          state.plays.push({ beat_id, created_at: new Date().toISOString() });
      });
    } else {
      const jar = await cookies();
      let visitor = jar.get('offgrid_visitor')?.value;
      if (!visitor || !/^[0-9a-f-]{36}$/.test(visitor)) {
        visitor = randomUUID();
        jar.set('offgrid_visitor', visitor, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 86400,
          path: '/',
        });
      }
      const hash = createHash('sha256').update(visitor).digest('hex');
      const db = supabaseAdmin();
      const { data: beat } = await db
        .from('beats')
        .select('id,store_id,published,release_at')
        .eq('id', beat_id)
        .eq('published', true)
        .maybeSingle();
      if (!beat || !isBeatLive(beat)) throw new Error('Beat unavailable');
      storeId = beat.store_id;
      const { data: store } = await db
        .from('stores')
        .select('id')
        .eq('id', beat.store_id)
        .eq('published', true)
        .maybeSingle();
      if (!store) throw new Error('Store unavailable');
      const { data: recent, error: lookupError } = await db
        .from('play_events')
        .select('id')
        .eq('beat_id', beat_id)
        .eq('visitor_hash', hash)
        .gte('created_at', new Date(Date.now() - 60000).toISOString())
        .limit(1);
      if (lookupError) throw lookupError;
      if (!recent?.length) {
        const { error } = await db
          .from('play_events')
          .insert({ beat_id, store_id: beat.store_id, visitor_hash: hash });
        if (error) throw error;
      }
    }
    await recordEvent(storeId, 'play', 'direct', beat_id);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
