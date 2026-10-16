import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitPayment,
  percentToBasisPoints,
  parsePrice,
  licenseFiles,
  canDownload,
  shouldFulfill,
} from '../src/lib/business';
import { validateUpload, storeSchema } from '../src/lib/validation';
import { demoWorkspace } from '../src/lib/demo-data';
import type { Order } from '../src/lib/types';
test('money is parsed without floating point currency arithmetic', () => {
  assert.equal(parsePrice('19.99'), 1999);
  assert.equal(parsePrice('0.50'), 50);
  for (const v of ['-1', '19.999', 'NaN', '0.49', '1e4']) assert.throws(() => parsePrice(v));
  assert.equal(percentToBasisPoints('10.25'), 1025);
  assert.throws(() => percentToBasisPoints('100.01'));
});
test('fee rounding and conservation across prices and percentage boundaries', () => {
  assert.deepEqual(splitPayment(1999, 1000), {
    amount_cents: 1999,
    fee_cents: 200,
    earnings_cents: 1799,
  });
  assert.deepEqual(splitPayment(2999, 800), {
    amount_cents: 2999,
    fee_cents: 240,
    earnings_cents: 2759,
  });
  assert.deepEqual(splitPayment(2000, 800), {
    amount_cents: 2000,
    fee_cents: 160,
    earnings_cents: 1840,
  });
  assert.deepEqual(splitPayment(50, 100), { amount_cents: 50, fee_cents: 1, earnings_cents: 49 });
  for (let cents = 50; cents < 100000; cents += 137) {
    for (const basis of [0, 1, 200, 300, 400, 500, 800, 999, 1025, 5000, 10000]) {
      const p = splitPayment(cents, basis);
      assert.equal(p.fee_cents + p.earnings_cents, cents);
      assert.ok(p.fee_cents >= 0 && p.earnings_cents >= 0);
    }
  }
  assert.throws(() => splitPayment(1.5, 1000));
  assert.throws(() => splitPayment(100, -1));
});
test('demo identifiers are unique and each license resolves only its own beat files', () => {
  const data = demoWorkspace();
  for (const list of [data.beats, data.licenses, data.files])
    assert.equal(new Set(list.map((x) => x.id)).size, list.length);
  for (const l of data.licenses.filter((l) => l.beat_id)) {
    const files = licenseFiles(l, data.files);
    assert.equal(files.length, l.deliverables.length);
    assert.ok(
      files.every((f) => data.files.some((df) => df.id === f.id && df.beat_id === l.beat_id)),
    );
  }
  const l = data.licenses.find((l) => l.beat_id && l.deliverables.length === 1)!;
  assert.throws(() =>
    licenseFiles(
      l,
      data.files.filter((f) => f.kind !== 'mp3'),
    ),
  );
  assert.throws(() => licenseFiles({ ...l, active: false }, data.files));
  assert.throws(() =>
    licenseFiles(
      l,
      data.files.map((f) => ({ ...f, store_id: 'other' })),
    ),
  );
});
test('fulfillment requires payment, exact server total and currency; duplicates are no-ops', () => {
  const pending = { status: 'pending' as const, amount_cents: 1999, currency: 'usd' };
  assert.equal(shouldFulfill(pending, 1999, 'usd', 'paid'), true);
  for (const [total, currency, status] of [
    [1998, 'usd', 'paid'],
    [1999, 'eur', 'paid'],
    [1999, 'usd', 'unpaid'],
  ] as const)
    assert.equal(shouldFulfill(pending, total, currency, status), false);
  assert.equal(shouldFulfill({ ...pending, status: 'paid' }, 1999, 'usd', 'paid'), false);
  assert.equal(shouldFulfill({ ...pending, status: 'refunded' }, 1999, 'usd', 'paid'), false);
});
test('download authorization only grants completed purchased deliverables', () => {
  const order = {
    status: 'paid',
    fulfillment_status: 'ready',
    deliverables: ['mp3'],
    files: [{ kind: 'mp3' }],
  } as Order;
  assert.ok(canDownload(order, 'mp3'));
  assert.equal(canDownload(order, 'wav'), false);
  assert.equal(canDownload(order, 'stems'), false);
  for (const status of ['pending', 'refunded'] as const)
    assert.equal(canDownload({ ...order, status }, 'mp3'), false);
  assert.equal(canDownload({ ...order, fulfillment_status: 'pending' }, 'mp3'), false);
});
test('unsafe file names, MIME types and upload sizes are rejected', () => {
  validateUpload('preview', 'beat.mp3', 1000, 'audio/mpeg');
  validateUpload('stems', 'stems.zip', 1000, 'application/zip');
  for (const filename of ['../secret.mp3', 'folder/beat.mp3', 'folder\\beat.mp3', 'a\u0000.mp3'])
    assert.throws(() => validateUpload('mp3', filename, 100, 'audio/mpeg'));
  assert.throws(() => validateUpload('cover', 'cover.svg', 100, 'image/svg+xml'));
  assert.throws(() => validateUpload('wav', 'beat.wav', 600 * 1024 * 1024, 'audio/wav'));
  assert.throws(() => validateUpload('preview', 'beat.mp3', 100, 'text/html'));
  assert.equal(
    storeSchema.safeParse({ username: 'dashboard', display_name: 'Producer' }).success,
    false,
  );
  assert.equal(
    storeSchema.safeParse({
      username: 'name',
      display_name: 'Producer',
      website: 'javascript:alert(1)',
    }).success,
    false,
  );
});
