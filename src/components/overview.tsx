'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Wallet,
  ShoppingBag,
  Headphones,
  Disc3,
  ExternalLink,
  Check,
} from 'lucide-react';
import type { Workspace } from '@/lib/types';
import { isBeatLive } from '@/lib/tools';
import { money } from '@/lib/business';
import { calendarDay, shortDate } from '@/lib/dates';
import { PageHeading, UploadLink } from './dashboard-shell';
import { Empty } from './ui';
export function Overview({ data, demo, asOf }: { data: Workspace; demo: boolean; asOf: string }) {
  const [copied, setCopied] = useState(false);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');
  const now = Date.parse(asOf),
    since = period === 'week' ? now - 7 * 86400000 : period === 'month' ? now - 30 * 86400000 : 0;
  const orders = data.orders.filter(
    (o) => o.status === 'paid' && Date.parse(o.paid_at || o.created_at) >= since,
  );
  const revenue = orders.reduce((s, o) => s + o.amount_cents, 0),
    earnings = orders.reduce((s, o) => s + o.earnings_cents, 0);
  const plays =
    data.play_counts?.[period] ??
    data.plays.filter((p) => Date.parse(p.created_at) >= since).length;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    const key = calendarDay(d);
    return {
      label: shortDate(d),
      value: orders
        .filter((o) => calendarDay(o.paid_at || o.created_at) === key)
        .reduce((s, o) => s + o.amount_cents, 0),
    };
  });
  const max = Math.max(10000, ...days.map((d) => d.value));
  const perBeatSales = (id: string) =>
    orders.flatMap((o) =>
      o.items?.length
        ? o.items.filter((i) => i.beat_id === id).map((i) => ({ amount_cents: i.amount_cents }))
        : o.beat_id === id
          ? [{ amount_cents: o.amount_cents }]
          : [],
    );
  const collaboratorTotal = orders.reduce(
    (sum, o) =>
      sum +
      (o.items || []).reduce((n, i) => n + i.splits.reduce((a, c) => a + c.amount_cents, 0), 0),
    0,
  );
  const best = [...data.beats]
    .sort((a, b) => perBeatSales(b.id).length - perBeatSales(a.id).length)
    .slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="YOUR SOUND. YOUR BUSINESS."
        title={`Welcome back, ${data.store.display_name}.`}
        description="A little less admin. A little more time making music."
      >
        <label className="period-select">
          <select
            aria-label="Analytics period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'all' | 'week' | 'month')}
          >
            <option value="all">All time</option>
            <option value="month">Last 30 days</option>
            <option value="week">Last 7 days</option>
          </select>
        </label>
        <UploadLink />
      </PageHeading>
      {(!data.beats.some((b) => b.published) ||
        !(data.stripe?.charges_enabled && data.stripe?.payouts_enabled)) && (
        <section className="setup-guide" aria-label="Store setup checklist">
          <div>
            <h2>Your next steps</h2>
            <p>Get your store ready, then share it with the world.</p>
          </div>
          <div className="setup-steps">
            <Link href="/dashboard/store" className="setup-step">
              <span>1</span>Customize store
            </Link>
            <Link href="/dashboard/beats" className="setup-step">
              <span>{data.beats.some((b) => b.published) ? <Check size={14} /> : 2}</span>Upload &
              publish
            </Link>
            <Link href="/dashboard/settings" className="setup-step">
              <span>3</span>Connect payments
            </Link>
          </div>
        </section>
      )}
      <div className="stats-grid">
        {[
          {
            label: 'Total revenue',
            value: money(revenue),
            icon: Wallet,
            sub: `${money(earnings - collaboratorTotal)} producer earnings${collaboratorTotal ? ' after collaborator shares' : ''}`,
          },
          {
            label: 'Beat sales',
            value: String(orders.reduce((sum, o) => sum + (o.items?.length || 1), 0)),
            icon: ShoppingBag,
            sub: orders.length ? 'Completed purchases' : 'Your first sale starts here',
          },
          {
            label: 'Preview plays',
            value: plays.toLocaleString(),
            icon: Headphones,
            sub: 'Listening turns into possibility',
          },
          {
            label: 'Published beats',
            value: String(data.beats.filter((b) => isBeatLive(b, now)).length),
            icon: Disc3,
            sub: `${data.beats.filter((b) => !b.published).length} drafts · ${data.beats.filter((b) => b.published && !isBeatLive(b, now)).length} scheduled`,
          },
        ].map(({ label, value, icon: Icon, sub }) => (
          <div className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <strong>{value}</strong>
            <p>{sub}</p>
          </div>
        ))}
      </div>
      <div className="overview-columns">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue</h2>
              <p>The last 14 days, in USD</p>
            </div>
            <span className="status-pill">
              <span className="status-dot" /> Completed sales
            </span>
          </div>
          <div className="revenue-chart">
            <div className="chart-axis">
              {[max, max * 0.75, max * 0.5, max * 0.25, 0].map((n) => (
                <span key={n}>{money(Math.round(n)).replace('.00', '')}</span>
              ))}
            </div>
            <div className="chart-plot">
              <div className="chart-grid">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} />
                ))}
              </div>
              <div className="chart-bars">
                {days.map((d) => (
                  <div
                    className="chart-column"
                    key={d.label}
                    title={`${d.label}: ${money(d.value)}`}
                  >
                    <div style={{ height: `${(d.value / max) * 100}%` }} />
                    <span>{d.label}</span>
                  </div>
                ))}
              </div>
              {!orders.length && (
                <div className="chart-empty">
                  <AudioIcon />
                  <span>Your next record starts the chart.</span>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="store-promo">
          <h2>
            Your store.
            <br />
            <span className="accent">Ready to share.</span>
          </h2>
          <p>
            Your sound has a home.
            <br />
            Put it in your bio.
          </p>
          <div className="store-url">
            <span>{copied ? 'Copied!' : `/${data.store.username}`}</span>
            <button
              className="icon-button"
              aria-label={copied ? 'Link copied' : 'Copy storefront link'}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/${data.store.username}`,
                  );
                  setCopied(true);
                } catch {
                  window.open(`/${data.store.username}`, '_blank');
                }
              }}
            >
              <ExternalLink size={15} />
            </button>
          </div>
          <Link href={`/${data.store.username}`} className="text-link">
            Open your store <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <div className="overview-columns lower">
        <section className="panel">
          <div className="panel-heading">
            <h2>Recent orders</h2>
            <Link href="/dashboard/orders" className="text-link muted">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {orders.length ? (
            <div className="recent-orders">
              {orders.slice(0, 4).map((o) => (
                <Link key={o.id} href={`/dashboard/orders?order=${o.id}`}>
                  <div className="order-initial">{o.customer_email[0].toUpperCase()}</div>
                  <div>
                    <strong>{o.beat_title}</strong>
                    <span>
                      {o.customer_email} · {o.license_name}
                    </span>
                  </div>
                  <b>{money(o.amount_cents)}</b>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="The first one is a good one."
              description="Your completed sales will show up here."
            >
              <Link href={`/${data.store.username}`} className="text-link">
                {demo ? 'Make a demo purchase' : 'Share your store'}
                <ArrowUpRight size={14} />
              </Link>
            </Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>{orders.length ? 'Best-selling beats' : 'In your catalog'}</h2>
            <Link href="/dashboard/beats" className="text-link muted">
              Your beats <ArrowRight size={14} />
            </Link>
          </div>
          <div className="best-beats">
            {best.map((b, i) => {
              const sales = perBeatSales(b.id);
              return (
                <div key={b.id}>
                  <span className="muted">0{i + 1}</span>
                  <img src={b.cover_url || '/demo/cover-1.svg'} alt="" />
                  <div>
                    <strong>{b.title}</strong>
                    <span>
                      {b.bpm} BPM · {b.musical_key}
                    </span>
                  </div>
                  <div className="best-sales">
                    <strong>{money(sales.reduce((s, o) => s + o.amount_cents, 0))}</strong>
                    <span>{sales.length} sales</span>
                  </div>
                </div>
              );
            })}
            {!best.length && (
              <Empty
                title="Your catalog starts here"
                description="Upload your first beat to get going."
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
function AudioIcon() {
  return <Headphones size={24} />;
}
