'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowUpRight, Receipt } from 'lucide-react';
import type { Workspace, Order } from '@/lib/types';
import { money } from '@/lib/business';
import { shortDate, fullDate } from '@/lib/dates';
import { PageHeading } from './dashboard-shell';
import { Modal, Empty } from './ui';
export function Orders({ data }: { data: Workspace }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('all'),
    [selected, setSelected] = useState<Order | null>(
      data.orders.find((o) => o.id === params.get('order')) || null,
    );
  const orders = data.orders.filter(
    (o) =>
      `${o.customer_email} ${o.beat_title} ${o.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'all' || o.status === status),
  );
  return (
    <>
      <PageHeading
        eyebrow="DIRECT FROM YOUR STORE"
        title="Your orders."
        description="Every record starts with a beat. These started with yours."
      />
      <div className="library-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search orders"
            placeholder="Search by customer, beat, or order ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sort-control">
          <select
            aria-label="Filter order status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All orders</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
      </div>
      <section className="panel order-table-panel">
        {orders.length ? (
          <div className="table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Customer / beat</th>
                  <th>License</th>
                  <th>Sale</th>
                  <th>Platform fee</th>
                  <th>You earned</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <button className="table-title" onClick={() => setSelected(o)}>
                        <strong>{o.customer_email}</strong>
                        <span>{o.beat_title}</span>
                      </button>
                    </td>
                    <td>{o.license_name}</td>
                    <td>{money(o.amount_cents)}</td>
                    <td className="muted">{money(o.fee_cents)}</td>
                    <td className="accent">
                      {money(
                        o.earnings_cents -
                          (o.items || []).reduce(
                            (sum, i) => sum + i.splits.reduce((n, c) => n + c.amount_cents, 0),
                            0,
                          ),
                      )}
                    </td>
                    <td>{shortDate(o.created_at)}</td>
                    <td>
                      <span className={`status-pill ${o.status === 'paid' ? '' : 'inactive'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`View order ${o.id}`}
                        onClick={() => setSelected(o)}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Your first sale is waiting."
            description="Completed purchases and their payment breakdown appear here."
          />
        )}
      </section>
      {selected && (
        <Modal title="Order details" onClose={() => setSelected(null)}>
          <div className="order-detail-title">
            <Receipt size={25} />
            <div>
              <h3>{selected.beat_title}</h3>
              <p>{selected.license_name}</p>
            </div>
            <span className="status-pill">{selected.status}</span>
          </div>
          <dl className="detail-list">
            <dt>Order ID</dt>
            <dd className="mono">{selected.id}</dd>
            <dt>Customer</dt>
            <dd>{selected.customer_email}</dd>
            <dt>Date</dt>
            <dd>{fullDate(selected.created_at)}</dd>
            <dt>Sale amount</dt>
            <dd>{money(selected.amount_cents)} USD</dd>
            {selected.discount_cents ? (
              <>
                <dt>Discount</dt>
                <dd>
                  {money(selected.discount_cents)} / {selected.promotion_code}
                </dd>
              </>
            ) : null}
            <dt>Platform fee</dt>
            <dd>{money(selected.fee_cents)}</dd>
            <dt>Producer earnings</dt>
            <dd className="accent">{money(selected.earnings_cents)}</dd>
            <dt>Fulfillment</dt>
            <dd>{selected.fulfillment_status}</dd>
            <dt>Included files</dt>
            <dd>{selected.deliverables.join(', ').toUpperCase()}</dd>
            <dt>Stripe session</dt>
            <dd className="mono">{selected.stripe_session_id || 'Simulated demo purchase'}</dd>
          </dl>
          {selected.items && selected.items.length > 1 && (
            <div className="tool-list">
              {selected.items.map((i) => (
                <div key={i.beat_id}>
                  <div>
                    <strong>
                      {i.beat_title} / {i.license_name}
                    </strong>
                    <small>
                      Sale allocation {money(i.amount_cents)} · Producer pool{' '}
                      {money(i.earnings_cents)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selected.items?.some((i) => i.splits.length > 0) && (
            <section className="tools-panel">
              <h3>Collaborator shares</h3>
              {selected.items.flatMap((i) =>
                i.splits.map((c) => (
                  <p key={`${i.beat_id}-${c.id}`} className="text-sm">
                    {c.name} / {i.beat_title}: {money(c.amount_cents)}
                  </p>
                )),
              )}
              <p className="text-sm">
                Your remainder:{' '}
                {money(
                  selected.earnings_cents -
                    selected.items.reduce(
                      (sum, i) => sum + i.splits.reduce((n, c) => n + c.amount_cents, 0),
                      0,
                    ),
                )}
              </p>
            </section>
          )}
          <details className="license-terms">
            <summary>Purchased license terms</summary>
            <p>{selected.license_terms}</p>
          </details>
        </Modal>
      )}
    </>
  );
}
