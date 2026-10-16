import { z } from 'zod';
import { assertOrigin, apiError } from '@/lib/http';
import { catalog } from '@/lib/data';
import { recordEvent } from '@/lib/tools-server';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = z
      .object({ username: z.string().max(30), source: z.string().max(100).optional() })
      .parse(await request.json());
    const state = await catalog(input.username);
    if (!state) throw new Error('Store unavailable');
    await recordEvent(state.store.id, 'visit', input.source || 'direct');
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
