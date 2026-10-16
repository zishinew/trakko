import 'server-only';
import { supabaseAdmin } from './supabase/server';
import { sealReceipt, openReceipt, sendReceipt } from './receipt-email';
function secret() {
  const value = process.env.EMAIL_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error('Configure an email encryption key');
  return value;
}
export const encryptReceipt = (url: string) => sealReceipt(url, secret());
export const decryptReceipt = (value: string) => openReceipt(value, secret());
export async function deliverReceipts(limit = 10) {
  if (!process.env.RESEND_API_KEY || !process.env.RECEIPT_FROM_EMAIL)
    return { configured: false, sent: 0 };
  const db = supabaseAdmin();
  const { data: jobs, error } = await db.rpc('claim_receipts', { batch_size: limit });
  if (error) throw error;
  let sent = 0;
  for (const job of jobs || []) {
    try {
      const { data: order, error: lookup } = await db
        .from('orders')
        .select('*')
        .eq('id', job.order_id)
        .single();
      if (lookup || !order) throw new Error('Order unavailable');
      if (order.status !== 'paid') {
        const { error: disabled } = await db
          .from('mail_jobs')
          .update({ status: 'disabled', last_error: 'Order is not paid' })
          .eq('id', job.id);
        if (disabled) throw disabled;
        continue;
      }
      if (!order.receipt_ciphertext) throw new Error('Receipt link missing; contact support');
      // Resend retains idempotency keys for 24 hours. Do not automatically retry an
      // uncertain delivery beyond that window; it needs reconciliation by the operator.
      if (job.attempts > 1 && Date.now() - Date.parse(job.created_at) > 23 * 3600000)
        throw new Error('Delivery needs provider reconciliation before retry');
      await sendReceipt(order, decryptReceipt(order.receipt_ciphertext), {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.RECEIPT_FROM_EMAIL,
      });
      const { error: save } = await db
        .from('mail_jobs')
        .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: '' })
        .eq('id', job.id);
      if (save) throw save;
      sent++;
    } catch (e) {
      const { error: save } = await db
        .from('mail_jobs')
        .update({ status: 'failed', last_error: (e as Error).message.slice(0, 200) })
        .eq('id', job.id);
      if (save) throw save;
    }
  }
  return { configured: true, sent };
}
