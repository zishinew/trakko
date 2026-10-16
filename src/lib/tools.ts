import { z } from 'zod';
import type { Beat, License, BeatFile, Order } from './types';
import { licenseFiles, percentToBasisPoints, splitPayment } from './business';
export const promotionSchema = z.object({
  id: z.uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,24}$/),
  percent: z.number().int().min(1).max(90),
  active: z.boolean(),
  expires_at: z.union([z.iso.datetime(), z.literal('')]),
});
export const bundleSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(60),
  beat_ids: z
    .array(z.uuid())
    .min(2)
    .max(20)
    .refine((v) => new Set(v).size === v.length),
  license_name: z.string().trim().min(1).max(40),
  price_cents: z.number().int().min(50).max(100000000),
  active: z.boolean(),
});
export const collaboratorSchema = z.object({
  id: z.uuid(),
  beat_id: z.uuid(),
  name: z.string().trim().min(1).max(60),
  email: z.email().max(254),
  percent: z
    .number()
    .min(0.01)
    .max(100)
    .refine(
      (v) =>
        Number.isInteger(Math.round(v * 100)) && Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
    ),
});
export const toolsSchema = z
  .object({
    promotions: z.array(promotionSchema).max(100),
    bundles: z.array(bundleSchema).max(100),
    collaborators: z.array(collaboratorSchema).max(100),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.promotions.map((p) => p.code)).size !== v.promotions.length)
      ctx.addIssue({ code: 'custom', message: 'Choose unique discount codes' });
    for (const id of new Set(v.collaborators.map((c) => c.beat_id))) {
      if (
        v.collaborators
          .filter((c) => c.beat_id === id)
          .reduce((sum, c) => sum + Math.round(c.percent * 100), 0) > 10000
      )
        ctx.addIssue({
          code: 'custom',
          message: 'Cannot allocate more than 100% of a beat’s producer earnings',
        });
    }
  });
export type ProducerTools = z.infer<typeof toolsSchema>;
export type Promotion = ProducerTools['promotions'][number];
export type Bundle = ProducerTools['bundles'][number];
export type Collaborator = ProducerTools['collaborators'][number];
export const emptyTools = (): ProducerTools => ({ promotions: [], bundles: [], collaborators: [] });
export type Contact = {
  id: string;
  store_id: string;
  email: string;
  marketing_consent: boolean;
  consent_at: string | null;
  created_at: string;
  beat_id: string | null;
};
export type StoreEvent = {
  id: string;
  store_id: string;
  beat_id: string | null;
  kind: 'visit' | 'play' | 'checkout' | 'free_download';
  source: string;
  visitor_hash: string;
  created_at: string;
};
export type MailJob = {
  id: string;
  order_id: string;
  store_id: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'disabled' | 'demo';
  attempts: number;
  last_error: string;
  created_at: string;
  sent_at: string | null;
  locked_at: string | null;
};
export type OrderItem = {
  beat_id: string;
  beat_title: string;
  license_id: string;
  license_name: string;
  license_terms: string;
  price_cents: number;
  amount_cents: number;
  earnings_cents: number;
  deliverables: License['deliverables'];
  file_ids: { id: string; kind: License['deliverables'][number] }[];
  splits: { id: string; name: string; email: string; percent: number; amount_cents: number }[];
};
export const isBeatLive = (beat: Pick<Beat, 'published' | 'release_at'>, now = Date.now()) =>
  beat.published && (!beat.release_at || Date.parse(beat.release_at) <= now);
export function validateTools(tools: ProducerTools, beats: Beat[], licenses: License[]) {
  for (const b of tools.bundles) {
    for (const id of b.beat_ids) {
      if (
        !beats.some((beat) => beat.id === id) ||
        !licenses.some((l) => l.beat_id === id && l.active && l.name === b.license_name)
      )
        throw new Error('Choose an available license for every beat in the bundle');
    }
  }
  if (tools.collaborators.some((c) => !beats.some((b) => b.id === c.beat_id)))
    throw new Error('Beat unavailable');
}
// Largest-remainder allocation preserves every cent, including discounted bundles.
export function allocate(total: number, weights: number[]) {
  if (
    !Number.isSafeInteger(total) ||
    total < 0 ||
    weights.some((w) => !Number.isSafeInteger(w) || w < 0)
  )
    throw new Error('Invalid allocation');
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const numerators = weights.map((w) => BigInt(total) * BigInt(w));
  const values = numerators.map((n) => Number(n / BigInt(sum)));
  const ranks = numerators
    .map((n, i) => ({ i, r: n % BigInt(sum) }))
    .sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  const remainder = total - values.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remainder; i++) values[ranks[i].i]++;
  return values;
}
export function pricePurchase(
  input: { beat_id?: string; license_id?: string; bundle_id?: string; code?: string },
  beats: Beat[],
  licenses: License[],
  files: BeatFile[],
  tools: ProducerTools,
  feeBasis: number,
) {
  const bundle = input.bundle_id
    ? tools.bundles.find((b) => b.id === input.bundle_id && b.active)
    : null;
  if (input.bundle_id && !bundle) throw new Error('Invalid bundle');
  const selected = bundle
    ? bundle.beat_ids.map((id) =>
        licenses.find((l) => l.beat_id === id && l.name === bundle.license_name && l.active),
      )
    : [licenses.find((l) => l.id === input.license_id && l.beat_id === input.beat_id && l.active)];
  if (selected.some((l) => !l)) throw new Error('License unavailable');
  const picked = selected as License[];
  const chosen = picked.map((l) => {
    const beat = beats.find((b) => b.id === l.beat_id && isBeatLive(b));
    if (!beat) throw new Error('Beat unavailable');
    return { beat, license: l, files: licenseFiles(l, files) };
  });
  const subtotal = bundle?.price_cents ?? picked[0].price_cents;
  let promo: Promotion | undefined;
  if (input.code?.trim()) {
    promo = tools.promotions.find(
      (p) =>
        p.code === input.code!.trim().toUpperCase() &&
        p.active &&
        (!p.expires_at || Date.parse(p.expires_at) > Date.now()),
    );
    if (!promo) throw new Error('Invalid or expired discount code');
  }
  const discount = promo
    ? splitPayment(subtotal, percentToBasisPoints(String(promo.percent))).fee_cents
    : 0;
  const payment = splitPayment(subtotal - discount, feeBasis);
  if (payment.amount_cents < 50) throw new Error('Price after discount must be at least $0.50');
  const amounts = allocate(
    payment.amount_cents,
    picked.map((l) => l.price_cents),
  );
  const fees = allocate(payment.fee_cents, amounts);
  const items: OrderItem[] = chosen.map(({ beat, license }, i) => {
    const earnings = amounts[i] - fees[i];
    const collaborators = tools.collaborators.filter((c) => c.beat_id === beat.id);
    const weights = collaborators.map((c) => Math.round(c.percent * 100));
    const splits = allocate(earnings, [...weights, 10000 - weights.reduce((a, b) => a + b, 0)]);
    return {
      beat_id: beat.id,
      beat_title: beat.title,
      license_id: license.id,
      license_name: license.name,
      license_terms: license.terms,
      price_cents: license.price_cents,
      amount_cents: amounts[i],
      earnings_cents: earnings,
      deliverables: license.deliverables,
      file_ids: chosen[i].files.map((f) => ({
        id: f.id,
        kind: f.kind as License['deliverables'][number],
      })),
      splits: collaborators.map((c, j) => ({ ...c, amount_cents: splits[j] })),
    };
  });
  return {
    ...payment,
    items,
    files: chosen.flatMap((c) => c.files),
    subtotal_cents: subtotal,
    discount_cents: discount,
    promotion_code: promo?.code || '',
    bundle_name: bundle?.name || '',
  };
}
export function collaboratorLedger(orders: Order[]) {
  const rows = new Map<
    string,
    { id: string; name: string; email: string; amount_cents: number; sales: number }
  >();
  for (const order of orders.filter((o) => o.status === 'paid'))
    for (const item of order.items || [])
      for (const split of item.splits) {
        const row = rows.get(split.id) || {
          id: split.id,
          name: split.name,
          email: split.email,
          amount_cents: 0,
          sales: 0,
        };
        row.amount_cents += split.amount_cents;
        row.sales++;
        rows.set(split.id, row);
      }
  return [...rows.values()];
}
export function publicTools(tools: ProducerTools, beatIds?: string[]) {
  return {
    bundles: tools.bundles.filter(
      (b) => b.active && (!beatIds || b.beat_ids.every((id) => beatIds.includes(id))),
    ),
    promotions: [],
    collaborators: [],
  };
}
