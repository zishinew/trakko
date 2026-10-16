import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sealReceipt, openReceipt, receiptEmail, sendReceipt } from '../src/lib/receipt-email';
import type { Order } from '../src/lib/types';
const order = {
  id: 'order-test',
  producer_name: 'Nova <script>',
  beat_title: '<img src=x onerror=alert(1)>',
  license_name: 'MP3 & WAV',
  customer_email: 'buyer@example.com',
  amount_cents: 2999,
} as Order;
test('private receipt links are encrypted and tampering or a different key is rejected', () => {
  const url = 'https://store.example/purchase/id?token=private';
  const cipher = sealReceipt(url, 'server-secret');
  assert.ok(!cipher.includes('private'));
  assert.equal(openReceipt(cipher, 'server-secret'), url);
  assert.throws(() => openReceipt(cipher, 'wrong-secret'));
  const b = Buffer.from(cipher, 'base64');
  b[14] ^= 1;
  assert.throws(() => openReceipt(b.toString('base64'), 'server-secret'));
});
test('receipt email escapes buyer-facing content and retries use the same provider idempotency key', async () => {
  const url = 'https://store.example/purchase/id?token=private&x="';
  const message = receiptEmail(order, url);
  assert.ok(message.html.includes('&lt;img'));
  assert.ok(!message.html.includes('<script>'));
  assert.ok(message.html.includes('&amp;x=&quot;'));
  let calls = 0;
  const transport: typeof fetch = async (input, init) => {
    calls++;
    assert.equal(input, 'https://api.resend.com/emails');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('Idempotency-Key'), 'receipt-order-test');
    assert.equal(headers.get('Authorization'), 'Bearer test-key');
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.to, ['buyer@example.com']);
    assert.ok(body.text.includes('$29.99'));
    return new Response(JSON.stringify({ id: 'provider-id' }), { status: 200 });
  };
  await sendReceipt(
    order,
    url,
    { apiKey: 'test-key', from: 'Store <receipts@example.com>' },
    transport,
  );
  await sendReceipt(
    order,
    url,
    { apiKey: 'test-key', from: 'Store <receipts@example.com>' },
    transport,
  );
  assert.equal(calls, 2);
  await assert.rejects(
    sendReceipt(
      order,
      url,
      { apiKey: 'test-key', from: 'receipts@example.com' },
      async () => new Response('', { status: 429 }),
    ),
    /429/,
  );
});
