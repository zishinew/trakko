import { authorizedOrder, escapeHtml, publicReceipt } from '@/lib/purchase';
import { money, canDownload } from '@/lib/business';
import { demoMode } from '@/lib/config';
import { demoRoot } from '@/lib/demo';
import { supabaseAdmin } from '@/lib/supabase/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Deliverable } from '@/lib/types';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const order = await authorizedOrder(id, url.searchParams.get('token') || '');
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
  if (!order) return Response.json({ error: 'Purchase not found' }, { status: 404, headers });
  const kind = url.searchParams.get('download');
  if (!kind) {
    const receipt = publicReceipt(order);
    return Response.json(receipt, { headers });
  }
  if (order.status !== 'paid' || order.fulfillment_status !== 'ready')
    return new Response('Payment is not complete', { status: 403, headers });
  if (kind === 'license') {
    const e = escapeHtml;
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>License ${e(order.id)}</title><style>body{font:16px/1.7 system-ui;max-width:760px;margin:60px auto;padding:24px;color:#171717}h1{font-size:32px}dl{display:grid;grid-template-columns:150px 1fr}dt{color:#666}dd{margin:0}pre{white-space:pre-wrap;font:inherit}hr{border:0;border-top:1px solid #ddd;margin:32px 0}@media print{body{margin:0}}</style><h1>Non-exclusive beat license</h1><p>Order / license ID: ${e(order.id)}</p><hr><dl><dt>Producer</dt><dd>${e(order.producer_name)}</dd><dt>Customer</dt><dd>${e(order.customer_email)}</dd><dt>Beat</dt><dd>${e(order.beat_title)}</dd><dt>License</dt><dd>${e(order.license_name)}</dd><dt>Purchased</dt><dd>${e(order.paid_at || order.created_at)}</dd><dt>Price</dt><dd>${e(money(order.amount_cents))} USD</dd><dt>Included files</dt><dd>${e(order.deliverables.join(', ').toUpperCase())}</dd></dl><hr><h2>License terms</h2><pre>${e(order.license_terms)}</pre></html>`;
    return new Response(html, {
      headers: {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="license-${id}.html"`,
      },
    });
  }
  if (!['mp3', 'wav', 'stems'].includes(kind) || !canDownload(order, kind as Deliverable))
    return new Response('File not included in this license', { status: 403, headers });
  const fileId = url.searchParams.get('file');
  const file = order.files.find((f) => f.kind === kind && (!fileId || f.id === fileId));
  if (!file) return new Response('File not included', { status: 403, headers });
  if (demoMode) {
    const path = file.path.startsWith('demo/')
      ? join(process.cwd(), 'demo-private', `sample.${kind === 'stems' ? 'zip' : kind}`)
      : /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp3|wav|zip)$/.test(file.path)
        ? join(demoRoot, file.path)
        : null;
    if (!path) return new Response('File unavailable', { status: 404, headers });
    try {
      const bytes = await readFile(path);
      return new Response(bytes, {
        headers: {
          ...headers,
          'Content-Type':
            kind === 'mp3' ? 'audio/mpeg' : kind === 'wav' ? 'audio/wav' : 'application/zip',
          'Content-Disposition': `attachment; filename="${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}"`,
        },
      });
    } catch {
      return new Response('File unavailable', { status: 404, headers });
    }
  }
  const { data, error } = await supabaseAdmin()
    .storage.from('beat-deliverables')
    .createSignedUrl(file.path, 60, { download: file.name });
  if (error) return new Response('Download temporarily unavailable', { status: 503, headers });
  return new Response(null, { status: 302, headers: { ...headers, Location: data.signedUrl } });
}
