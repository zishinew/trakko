import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { demoMode } from '@/lib/config';
import { demoSession, mutateDemo } from '@/lib/demo';
import { workspace, ownedStore } from '@/lib/data';
import { assertOrigin, apiError } from '@/lib/http';
import { toolsSchema, validateTools, collaboratorLedger } from '@/lib/tools';
import { csvCell } from '@/lib/tools-server';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = toolsSchema.parse(await request.json());
    if (demoMode) {
      await mutateDemo(await demoSession(true), (s) => {
        validateTools(input, s.beats, s.licenses);
        s.tools = input;
      });
    } else {
      const state = await workspace();
      validateTools(input, state.beats, state.licenses);
      const { db, store } = await ownedStore();
      const { error } = await db
        .from('store_tools')
        .upsert({ store_id: store.id, config: input, updated_at: new Date().toISOString() });
      if (error) throw error;
    }
    return Response.json({ ok: true, id: randomUUID() });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET(request: Request) {
  try {
    const kind = z
      .enum(['contacts', 'splits'])
      .parse(new URL(request.url).searchParams.get('export'));
    const state = await workspace();
    const rows =
      kind === 'contacts'
        ? [
            ['Email', 'Marketing opt-in', 'Consent recorded', 'Downloaded beat', 'Created'],
            ...(state.contacts || []).map((c) => [
              c.email,
              c.marketing_consent ? 'yes' : 'no',
              c.consent_at,
              c.beat_id,
              c.created_at,
            ]),
          ]
        : [
            ['Name', 'Email', 'Amount owed USD', 'Sales'],
            ...collaboratorLedger(state.orders).map((c) => [
              c.name,
              c.email,
              (c.amount_cents / 100).toFixed(2),
              c.sales,
            ]),
          ];
    return new Response(rows.map((row) => row.map(csvCell).join(',')).join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${kind}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
