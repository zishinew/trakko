import { assertOrigin, apiError } from '@/lib/http';
import { checkoutSchema } from '@/lib/validation';
import { demoMode, feeBasisPoints } from '@/lib/config';
import { demoSession, readDemo } from '@/lib/demo';
import { emptyTools, pricePurchase } from '@/lib/tools';
import { checkoutCatalog } from '@/lib/data';
import { getTools } from '@/lib/tools-server';
import { supabaseAdmin } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = checkoutSchema.parse({ ...(await request.json()), email: 'quote@example.com' });
    let state;
    if (demoMode) state = await readDemo(await demoSession());
    else {
      const db = supabaseAdmin();
      let beatId = input.beat_id;
      if (input.bundle_id) {
        const username = new URL(request.url).searchParams.get('store');
        const { data: store } = await db
          .from('stores')
          .select('*')
          .eq('username', username || '')
          .eq('published', true)
          .maybeSingle();
        if (!store) throw new Error('Store unavailable');
        beatId = (await getTools(store.id)).bundles.find(
          (b) => b.id === input.bundle_id && b.active,
        )?.beat_ids[0];
      }
      if (!beatId) throw new Error('Beat unavailable');
      const ctx = await checkoutCatalog(beatId);
      const [beats, files] = await Promise.all([
        db.from('beats').select('*').eq('store_id', ctx.store.id),
        db.from('beat_files').select('*').eq('store_id', ctx.store.id),
      ]);
      if (beats.error) throw beats.error;
      if (files.error) throw files.error;
      state = {
        ...ctx,
        beats: beats.data || [],
        files: files.data || [],
        tools: await getTools(ctx.store.id),
      };
    }
    if (!state.store.published) throw new Error('Store unavailable');
    const quote = pricePurchase(
      input,
      state.beats,
      state.licenses,
      state.files,
      state.tools || emptyTools(),
      feeBasisPoints(),
    );
    return Response.json({
      subtotal_cents: quote.subtotal_cents,
      discount_cents: quote.discount_cents,
      amount_cents: quote.amount_cents,
    });
  } catch (e) {
    return apiError(e);
  }
}
