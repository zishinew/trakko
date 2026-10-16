import { createHash, timingSafeEqual } from 'node:crypto';
import { deliverReceipts } from '@/lib/email';
import { demoMode } from '@/lib/config';
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization') || '';
  if (
    !secret ||
    !timingSafeEqual(
      createHash('sha256').update(supplied).digest(),
      createHash('sha256').update(`Bearer ${secret}`).digest(),
    )
  )
    return new Response('Unauthorized', { status: 401 });
  if (demoMode) return Response.json({ configured: false, demo: true });
  try {
    return Response.json(await deliverReceipts());
  } catch {
    return Response.json({ error: 'Receipt worker failed' }, { status: 503 });
  }
}
