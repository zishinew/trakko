import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { Order } from './types';
import { money } from './business';
export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function sealReceipt(url: string, secret: string) {
  if (!secret) throw new Error('Configure an email encryption key');
  const iv = randomBytes(12),
    key = createHash('sha256').update(secret).digest();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  return Buffer.concat([
    iv,
    cipher.update(url, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString('base64');
}
export function openReceipt(value: string, secret: string) {
  const bytes = Buffer.from(value, 'base64'),
    key = createHash('sha256').update(secret).digest();
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString(
    'utf8',
  );
}
export function receiptEmail(order: Order, url: string) {
  const e = escapeHtml;
  return {
    subject: `Your purchase from ${order.producer_name}`,
    text: `Thanks for your purchase!\n${order.beat_title}\n${order.license_name}\nTotal: ${money(order.amount_cents)} USD\n\nDownload your files and license: ${url}\n\nKeep this private link safe.`,
    html: `<h1>Your next record starts here.</h1><p>${e(order.beat_title)} by ${e(order.producer_name)}</p><p>${e(order.license_name)} · ${e(money(order.amount_cents))} USD</p><p><a href="${e(url)}">Download your files and license</a></p><p>Keep this private link safe. Your license terms are on your receipt.</p>`,
  };
}
export async function sendReceipt(
  order: Order,
  url: string,
  config: { apiKey: string; from: string },
  transport: typeof fetch = fetch,
) {
  const result = await transport('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `receipt-${order.id}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [order.customer_email],
      ...receiptEmail(order, url),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok) throw new Error(`Email provider returned ${result.status}`);
}
