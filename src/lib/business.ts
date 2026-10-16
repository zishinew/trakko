import type { BeatFile, Deliverable, License, Order } from './types';
export function percentToBasisPoints(value: string): number {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value))
    throw new Error('Fee must be a percentage with up to two decimal places');
  const [whole, fraction = ''] = value.split('.');
  const basis = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (basis > 10000) throw new Error('Fee exceeds 100%');
  return basis;
}
export function splitPayment(cents: number, basisPoints: number) {
  if (
    !Number.isSafeInteger(cents) ||
    cents < 0 ||
    cents > 100000000 ||
    !Number.isInteger(basisPoints) ||
    basisPoints < 0 ||
    basisPoints > 10000
  )
    throw new Error('Invalid payment amount');
  const fee_cents = Number((BigInt(cents) * BigInt(basisPoints) + 5000n) / 10000n);
  return { amount_cents: cents, fee_cents, earnings_cents: cents - fee_cents };
}
export function parsePrice(value: string): number {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value))
    throw new Error('Enter a valid price, for example 19.99');
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents < 50 || cents > 100000000)
    throw new Error('Price must be between $0.50 and $1,000,000');
  return cents;
}
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function licenseFiles(license: License, files: BeatFile[]) {
  if (!license.active || !license.beat_id || license.deliverables.length === 0)
    throw new Error('License unavailable');
  return license.deliverables.map((kind) => {
    const file = files.find(
      (f) => f.beat_id === license.beat_id && f.store_id === license.store_id && f.kind === kind,
    );
    if (!file) throw new Error(`This license needs an uploaded ${kind.toUpperCase()} file`);
    return { id: file.id, kind: file.kind, path: file.path, name: file.name };
  });
}
export function canDownload(order: Order, kind: Deliverable) {
  return (
    order.status === 'paid' &&
    order.fulfillment_status === 'ready' &&
    order.deliverables.includes(kind) &&
    order.files.some((f) => f.kind === kind)
  );
}
export function shouldFulfill(
  order: Pick<Order, 'status' | 'amount_cents' | 'currency'>,
  total: number | null,
  currency: string | null,
  paymentStatus: string,
) {
  return (
    order.status === 'pending' &&
    paymentStatus === 'paid' &&
    total === order.amount_cents &&
    currency?.toLowerCase() === order.currency
  );
}
