import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoWorkspace } from '../src/lib/demo-data';
import {
  allocate,
  emptyTools,
  isBeatLive,
  pricePurchase,
  toolsSchema,
  collaboratorLedger,
} from '../src/lib/tools';
import type { Order } from '../src/lib/types';
const coupon = '50000000-0000-4000-8000-000000000001',
  bundle = '50000000-0000-4000-8000-000000000002',
  collab = '50000000-0000-4000-8000-000000000003';
test('bundle discounts conserve cents, snapshot every file and allocate collaborator earnings after fees', () => {
  const s = demoWorkspace();
  const tools = {
    ...emptyTools(),
    promotions: [{ id: coupon, code: 'LAUNCH20', percent: 20, active: true, expires_at: '' }],
    bundles: [
      {
        id: bundle,
        name: 'Night pair',
        beat_ids: s.beats.slice(0, 2).map((b) => b.id),
        price_cents: 3000,
        license_name: 'MP3 Lease',
        active: true,
      },
    ],
    collaborators: [
      {
        id: collab,
        beat_id: s.beats[0].id,
        name: 'Partner',
        email: 'partner@example.com',
        percent: 25,
      },
    ],
  };
  const p = pricePurchase(
    { bundle_id: bundle, code: 'launch20' },
    s.beats,
    s.licenses,
    s.files,
    tools,
    800,
  );
  assert.equal(p.amount_cents, 2400);
  assert.equal(p.fee_cents, 192);
  assert.equal(p.earnings_cents, 2208);
  assert.equal(p.discount_cents, 600);
  assert.equal(p.items.length, 2);
  assert.equal(p.files.length, 2);
  assert.notEqual(p.files[0].id, p.files[1].id);
  assert.equal(
    p.items.reduce((sum, i) => sum + i.amount_cents, 0),
    p.amount_cents,
  );
  assert.equal(
    p.items.reduce((sum, i) => sum + i.earnings_cents, 0),
    p.earnings_cents,
  );
  assert.equal(
    p.items[0].splits[0].amount_cents,
    allocate(p.items[0].earnings_cents, [2500, 7500])[0],
  );
  const original = p.items[0].splits[0].amount_cents;
  tools.collaborators[0].percent = 80;
  assert.equal(p.items[0].splits[0].amount_cents, original);
  const paid = { ...p, status: 'paid' } as Order;
  assert.equal(collaboratorLedger([paid])[0].amount_cents, original);
  assert.deepEqual(collaboratorLedger([{ ...paid, status: 'refunded' }]), []);
});
test('scheduled releases and expired, paused, missing-file or invalid promotions cannot be purchased', () => {
  const s = demoWorkspace(),
    b = s.beats[0],
    l = s.licenses.find((l) => l.beat_id === b.id)!;
  const input = { beat_id: b.id, license_id: l.id };
  assert.equal(isBeatLive({ ...b, release_at: new Date(Date.now() + 60000).toISOString() }), false);
  assert.throws(
    () =>
      pricePurchase(
        input,
        s.beats.map((x) =>
          x.id === b.id ? { ...x, release_at: new Date(Date.now() + 60000).toISOString() } : x,
        ),
        s.licenses,
        s.files,
        emptyTools(),
        800,
      ),
    /Beat unavailable/,
  );
  for (const promo of [
    { active: false, expires_at: '' },
    { active: true, expires_at: '2000-01-01T00:00:00Z' },
  ])
    assert.throws(
      () =>
        pricePurchase(
          { ...input, code: 'NOPE' },
          s.beats,
          s.licenses,
          s.files,
          { ...emptyTools(), promotions: [{ id: coupon, code: 'NOPE', percent: 10, ...promo }] },
          800,
        ),
      /expired/,
    );
  assert.throws(() => pricePurchase(input, s.beats, s.licenses, [], emptyTools(), 800), /uploaded/);
  assert.throws(
    () =>
      toolsSchema.parse({
        ...emptyTools(),
        collaborators: [
          { id: collab, beat_id: b.id, name: 'A', email: 'a@example.com', percent: 70 },
          { id: bundle, beat_id: b.id, name: 'B', email: 'b@example.com', percent: 40 },
        ],
      }),
    /100%/,
  );
});
test('largest remainder allocations preserve totals for uneven discounted prices and tiny earnings', () => {
  for (let total = 0; total < 1000; total += 7) {
    for (const weights of [
      [1, 1, 1],
      [1999, 2499],
      [2500, 3333, 4167],
      [0, 10000],
    ]) {
      const a = allocate(total, weights);
      assert.equal(
        a.reduce((s, n) => s + n, 0),
        total,
      );
      assert.ok(a.every((n) => Number.isInteger(n) && n >= 0));
    }
  }
});
