import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { assertOrigin, apiError } from '@/lib/http';
import { catalog } from '@/lib/data';
import { demoMode } from '@/lib/config';
import { demoSession, mutateDemo } from '@/lib/demo';
import { supabaseAdmin } from '@/lib/supabase/server';
import { recordEvent } from '@/lib/tools-server';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const v = z
      .object({
        username: z.string().max(30),
        beat_id: z.uuid(),
        email: z.email().max(254),
        marketing_consent: z.boolean(),
        accept_terms: z.literal(true),
        source: z.string().max(100).optional(),
      })
      .parse(await request.json());
    const state = await catalog(v.username);
    const beat = state?.beats.find((b) => b.id === v.beat_id && b.free_download && b.preview_url);
    if (!state || !beat) throw new Error('Beat unavailable for free download');
    const email = v.email.toLowerCase();
    const now = new Date().toISOString();
    if (demoMode)
      await mutateDemo(await demoSession(true), (s) => {
        s.contacts ||= [];
        const old = s.contacts.find((c) => c.email === email);
        if (old) {
          old.beat_id = beat.id;
          if (v.marketing_consent) {
            old.marketing_consent = true;
            old.consent_at = now;
          }
        } else
          s.contacts.push({
            id: randomUUID(),
            store_id: state.store.id,
            email,
            beat_id: beat.id,
            marketing_consent: v.marketing_consent,
            consent_at: v.marketing_consent ? now : null,
            created_at: now,
          });
      });
    else {
      const db = supabaseAdmin();
      const { data: old, error: readError } = await db
        .from('contacts')
        .select('*')
        .eq('store_id', state.store.id)
        .eq('email', email)
        .maybeSingle();
      if (readError) throw readError;
      const { error } = await db.from('contacts').upsert(
        {
          store_id: state.store.id,
          email,
          beat_id: beat.id,
          marketing_consent: v.marketing_consent || !!old?.marketing_consent,
          consent_at: v.marketing_consent ? now : old?.consent_at || null,
        },
        { onConflict: 'store_id,email' },
      );
      if (error) throw error;
    }
    await recordEvent(state.store.id, 'free_download', v.source || 'direct', beat.id).catch(() =>
      console.error('Free-download analytics could not be recorded'),
    );
    return Response.json({
      url: beat.preview_url,
      terms:
        beat.free_download_terms ||
        'Non-commercial demo use only. Credit the producer. No distribution, resale, or Content ID registration.',
    });
  } catch (e) {
    return apiError(e);
  }
}
