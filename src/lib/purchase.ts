import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { demoMode } from './config';
import { demoSession, readDemo } from './demo';
import { supabaseAdmin } from './supabase/server';
import type { Order } from './types';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export async function authorizedOrder(id: string, token: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f]{64}$/.test(token)) return null;
  let order: Order | null;
  if (demoMode)
    order = (await readDemo(await demoSession())).orders.find((o) => o.id === id) || null;
  else {
    const { data, error } = await supabaseAdmin()
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    order = data;
  }
  if (
    !order ||
    order.token_hash.length !== 64 ||
    !timingSafeEqual(Buffer.from(order.token_hash, 'hex'), Buffer.from(hashToken(token), 'hex'))
  )
    return null;
  return order;
}
export { escapeHtml } from './receipt-email';
export function publicReceipt(order: Order) {
  const { token_hash: _token, files: _files, receipt_ciphertext: _cipher, ...receipt } = order;
  void _token;
  void _files;
  void _cipher;
  return { ...receipt, items: (order.items || []).map((i) => ({ ...i, splits: [] })) };
}
