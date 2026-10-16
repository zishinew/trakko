'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Download, FileText, ArrowUpRight, Loader2, ShieldCheck } from 'lucide-react';
import type { Order } from '@/lib/types';
import { money } from '@/lib/business';
import { Logo, Notice } from './ui';
export function PurchaseReceipt({
  initial,
  token,
  demo,
}: {
  initial: Omit<Order, 'token_hash' | 'files'>;
  token: string;
  demo: boolean;
}) {
  const [order, setOrder] = useState(initial),
    [error, setError] = useState('');
  useEffect(() => {
    if (order.status !== 'pending') return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/purchases/${order.id}?token=${token}`, {
          cache: 'no-store',
        });
        if (!response.ok)
          throw new Error('Unable to refresh payment status. Reload this page to retry.');
        const result = await response.json();
        if (active) setOrder(result);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [order.id, order.status, token]);
  const ready = order.status === 'paid' && order.fulfillment_status === 'ready';
  const download = (kind: string, file?: string) =>
    `/api/purchases/${order.id}?token=${token}&download=${kind}${file ? `&file=${file}` : ''}`;
  return (
    <main className="receipt-page">
      <Logo />
      <section className="receipt-card">
        <div className="receipt-check">
          {ready ? (
            <Check size={30} />
          ) : (
            <Loader2 size={28} className={order.status === 'pending' ? 'spin' : ''} />
          )}
        </div>
        <span className="eyebrow">
          {ready
            ? 'YOUR NEXT RECORD STARTS HERE'
            : order.status === 'refunded'
              ? 'PURCHASE REFUNDED'
              : 'CONFIRMING YOUR PAYMENT'}
        </span>
        <h1>
          {ready
            ? 'It’s yours. Make something.'
            : order.status === 'refunded'
              ? 'This order was refunded.'
              : 'Almost in your hands.'}
        </h1>
        <p className="muted">
          {ready
            ? `“${order.beat_title}” by ${order.producer_name}`
            : order.status === 'refunded'
              ? 'Downloads for refunded orders are disabled.'
              : 'We’re waiting for Stripe to confirm your payment. This page updates automatically.'}
        </p>
        {demo && (
          <Notice>
            Simulated demo purchase. No money was charged. Downloads contain original synthesized
            demo audio.
          </Notice>
        )}
        {error && <Notice error>{error}</Notice>}
        <div className="receipt-summary">
          <div>
            <span>License</span>
            <strong>{order.license_name}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{money(order.amount_cents)} USD</strong>
          </div>
          <div>
            <span>Customer</span>
            <strong>{order.customer_email}</strong>
          </div>
        </div>
        {ready && (
          <>
            <h2>Your files</h2>
            <div className="download-list">
              {(order.items && order.items.length > 1
                ? order.items.flatMap((i) =>
                    i.deliverables.map((d) => ({
                      kind: d,
                      beat: i.beat_title,
                      id: i.file_ids?.find((f) => f.kind === d)?.id || '',
                    })),
                  )
                : order.deliverables.map((d) => ({ kind: d, beat: '', id: '' }))
              ).map(({ kind: d, beat, id }) => (
                <a key={`${id}-${d}`} href={download(d, id)} referrerPolicy="no-referrer">
                  <div>
                    <Download size={19} />
                    <span>
                      <strong>
                        {beat ? `${beat} / ` : ''}
                        {d === 'stems' ? 'Trackout / stems' : d.toUpperCase()}
                      </strong>
                      <small>{d === 'stems' ? 'ZIP archive' : 'Untagged audio file'}</small>
                    </span>
                  </div>
                  <ArrowUpRight size={18} />
                </a>
              ))}
              <a href={download('license')} referrerPolicy="no-referrer">
                <div>
                  <FileText size={19} />
                  <span>
                    <strong>License & receipt</strong>
                    <small>Printable document · HTML</small>
                  </span>
                </div>
                <ArrowUpRight size={18} />
              </a>
            </div>
            <details className="license-terms">
              <summary>Your license terms</summary>
              <p>{order.license_terms}</p>
            </details>
            <p className="receipt-save">
              <ShieldCheck size={16} /> Save this private page link to access your purchase again.
              Download links expire after 60 seconds and can be renewed here.
            </p>
          </>
        )}
        <span className="receipt-order">ORDER {order.id}</span>
        <Link href="/" className="text-link">
          Back to {order.producer_name}’s platform <ArrowUpRight size={15} />
        </Link>
      </section>
    </main>
  );
}
