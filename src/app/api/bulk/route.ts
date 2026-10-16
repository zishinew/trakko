import { z } from 'zod';
import { assertOrigin, apiError } from '@/lib/http';
import { workspace } from '@/lib/data';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const v = z.object({ action: z.literal('licenses'), id: z.uuid() }).parse(await request.json());
    const data = await workspace();
    if (!data.beats.some((b) => b.id === v.id)) throw new Error('Beat unavailable');
    return Response.json({ licenses: data.licenses.filter((l) => l.beat_id === v.id) });
  } catch (e) {
    return apiError(e);
  }
}
