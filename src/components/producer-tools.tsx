'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Workspace } from '@/lib/types';
import { emptyTools, collaboratorLedger, type ProducerTools } from '@/lib/tools';
import { money, parsePrice } from '@/lib/business';
import { post } from '@/lib/client';
import { Button, Field, Notice, Empty } from './ui';
import { PageHeading } from './dashboard-shell';
export function Promotions({ data }: { data: Workspace }) {
  const router = useRouter();
  const [tools, setTools] = useState(data.tools || emptyTools());
  const [code, setCode] = useState(''),
    [percent, setPercent] = useState('15'),
    [expiry, setExpiry] = useState('');
  const [name, setName] = useState(''),
    [price, setPrice] = useState('50'),
    [license, setLicense] = useState('MP3 Lease'),
    [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function save(next: ProducerTools) {
    setBusy(true);
    setError('');
    try {
      await post('/api/tools', next);
      setTools(next);
      setMessage('Promotions saved.');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MORE MUSIC, MORE POSSIBILITIES"
        title="Promotions."
        description="Discount codes and curated bundles for your store."
      />
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="tools-columns">
        <section className="panel tools-panel">
          <h2>Discount codes</h2>
          <p className="muted text-sm">
            Codes apply to a beat or bundle. Expired and paused codes cannot be redeemed.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save({
                ...tools,
                promotions: [
                  ...tools.promotions,
                  {
                    id: crypto.randomUUID(),
                    code: code.toUpperCase(),
                    percent: Number(percent),
                    active: true,
                    expires_at: expiry ? new Date(expiry).toISOString() : '',
                  },
                ],
              });
            }}
          >
            <Field label="Discount code">
              <input
                required
                pattern="[A-Za-z0-9_\-]{3,24}"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <div className="form-two">
              <Field label="Discount percentage">
                <input
                  type="number"
                  required
                  min="1"
                  max="90"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                />
              </Field>
              <Field label="Expires at (optional)">
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" className="primary" busy={busy}>
              Create discount code
            </Button>
          </form>
          <div className="tool-list">
            {tools.promotions.map((p) => (
              <div key={p.id}>
                <div>
                  <strong>
                    {p.code} / {p.percent}% off
                  </strong>
                  <small>
                    {p.expires_at
                      ? `Expires ${`${p.expires_at.slice(0, 16).replace('T', ' ')} UTC`}`
                      : 'No expiry'}{' '}
                    · {p.active ? 'Active' : 'Paused'}
                  </small>
                </div>
                <Button
                  className="small"
                  busy={busy}
                  onClick={() =>
                    save({
                      ...tools,
                      promotions: tools.promotions.map((x) =>
                        x.id === p.id ? { ...x, active: !x.active } : x,
                      ),
                    })
                  }
                >
                  {p.active ? 'Pause' : 'Activate'}
                </Button>
                <Button
                  className="small"
                  busy={busy}
                  onClick={() =>
                    save({ ...tools, promotions: tools.promotions.filter((x) => x.id !== p.id) })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel tools-panel">
          <h2>Beat bundles</h2>
          <p className="muted text-sm">
            One price, one checkout, a separate license and files for every beat.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                void save({
                  ...tools,
                  bundles: [
                    ...tools.bundles,
                    {
                      id: crypto.randomUUID(),
                      name,
                      price_cents: parsePrice(price),
                      beat_ids: ids,
                      license_name: license,
                      active: true,
                    },
                  ],
                });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label="Bundle name">
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="form-two">
              <Field label="Bundle price USD">
                <input
                  required
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
              <Field label="Bundle license">
                <select value={license} onChange={(e) => setLicense(e.target.value)}>
                  {[
                    ...new Set(
                      data.licenses.filter((l) => l.active && l.beat_id).map((l) => l.name),
                    ),
                  ].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
            </div>
            <fieldset className="beat-choices">
              <legend>Include at least two beats</legend>
              {data.beats.map((b) => (
                <label key={b.id}>
                  <input
                    type="checkbox"
                    checked={ids.includes(b.id)}
                    onChange={(e) =>
                      setIds(e.target.checked ? [...ids, b.id] : ids.filter((id) => id !== b.id))
                    }
                  />
                  {b.title}
                </label>
              ))}
            </fieldset>
            <Button type="submit" className="primary" busy={busy} disabled={ids.length < 2}>
              Create bundle
            </Button>
          </form>
          <div className="tool-list">
            {tools.bundles.map((b) => (
              <div key={b.id}>
                <div>
                  <strong>
                    {b.name} / {money(b.price_cents)}
                  </strong>
                  <small>
                    {b.beat_ids.length} beats · {b.license_name} · {b.active ? 'Active' : 'Paused'}
                  </small>
                </div>
                <Button
                  className="small"
                  busy={busy}
                  onClick={() =>
                    save({
                      ...tools,
                      bundles: tools.bundles.map((x) =>
                        x.id === b.id ? { ...x, active: !x.active } : x,
                      ),
                    })
                  }
                >
                  {b.active ? 'Pause' : 'Activate'}
                </Button>
                <Button
                  className="small"
                  busy={busy}
                  onClick={() =>
                    save({ ...tools, bundles: tools.bundles.filter((x) => x.id !== b.id) })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
export function Audience({ data }: { data: Workspace }) {
  const contacts = data.contacts || [];
  const mail = data.mail_jobs || [];
  return (
    <>
      <PageHeading
        eyebrow="THE PEOPLE BEHIND THE PLAYS"
        title="Your audience."
        description="Free-download contacts, explicit marketing opt-ins, and purchase email delivery."
      >
        <a download className="button" href="/api/tools?export=contacts">
          Export contacts CSV
        </a>
      </PageHeading>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Contacts</span>
          <strong>{contacts.length}</strong>
        </div>
        <div className="stat-card">
          <span>Marketing opt-ins</span>
          <strong>{contacts.filter((c) => c.marketing_consent).length}</strong>
        </div>
        <div className="stat-card">
          <span>Receipt emails sent</span>
          <strong>{mail.filter((m) => m.status === 'sent').length}</strong>
        </div>
        <div className="stat-card">
          <span>Awaiting delivery</span>
          <strong>
            {mail.filter((m) => ['pending', 'sending', 'failed'].includes(m.status)).length}
          </strong>
        </div>
      </div>
      <Notice>
        Free downloads deliver the tagged preview under your non-commercial terms. Marketing
        permission is a separate, optional checkbox. Only opted-in contacts should receive
        promotional messages.
      </Notice>
      <section className="panel tools-panel">
        <h2>Contacts</h2>
        {!contacts.length ? (
          <Empty
            title="Your next listener is out there."
            description="Enable free downloads on a beat to start collecting contacts."
          />
        ) : (
          <div className="tools-table-wrap">
            <table className="tools-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Marketing permission</th>
                  <th>Consent recorded</th>
                  <th>Downloaded beat</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td>{c.email}</td>
                    <td>{c.marketing_consent ? 'Opted in' : 'Download only'}</td>
                    <td>
                      {c.consent_at ? `${c.consent_at.slice(0, 16).replace('T', ' ')} UTC` : '—'}
                    </td>
                    <td>{data.beats.find((b) => b.id === c.beat_id)?.title || 'Removed beat'}</td>
                    <td>{c.created_at.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel tools-panel">
        <h2>Purchase email delivery</h2>
        <p className="muted text-sm">
          Receipts include a private link to the files and licenses. Demo purchases show a preview;
          they never send mail.
        </p>
        <div className="tool-list">
          {mail.map((m) => {
            const order = data.orders.find((o) => o.id === m.order_id);
            return (
              <div key={m.id}>
                <div>
                  <strong>{order?.customer_email}</strong>
                  <small>
                    {order?.beat_title} · {m.attempts} attempts
                    {m.last_error ? ` · ${m.last_error}` : ''}
                  </small>
                </div>
                <span className="status-pill">
                  {m.status === 'demo' ? 'Demo preview' : m.status}
                </span>
                {m.status === 'demo' && (
                  <details>
                    <summary>Preview receipt</summary>
                    <p>
                      Thanks for purchasing {order?.beat_title}. Your {order?.license_name} files
                      and printable license are available on your private receipt page. Total:{' '}
                      {money(order?.amount_cents || 0)} USD.
                    </p>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
export function Analytics({ data }: { data: Workspace }) {
  const [period, setPeriod] = useState(30);
  const since = Date.parse(data.as_of || '1970-01-01') - period * 86400000;
  const events = (data.events || []).filter((e) => Date.parse(e.created_at) >= since);
  const orders = data.orders.filter(
    (o) => o.status === 'paid' && Date.parse(o.created_at) >= since,
  );
  const visits = events.filter((e) => e.kind === 'visit').length;
  const plays = new Set(events.filter((e) => e.kind === 'play').map((e) => e.visitor_hash)).size;
  const checkouts = events.filter((e) => e.kind === 'checkout').length;
  const sources = [
    ...new Set([...events.map((e) => e.source), ...orders.map((o) => o.source || 'direct')]),
  ];
  return (
    <>
      <PageHeading
        eyebrow="FROM FIRST PLAY TO NEXT RECORD"
        title="Conversion analytics."
        description="Visits, listening visitors, checkout starts, and completed purchases."
      >
        <select
          aria-label="Analytics range"
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </PageHeading>
      <div className="stats-grid">
        {[
          ['Store visits', visits],
          ['Listening visitors', plays],
          ['Checkout starts', checkouts],
          ['Completed purchases', orders.length],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel tools-panel">
        <h2>Your sales funnel</h2>
        <p className="muted text-sm">
          Visits and checkout starts are deduplicated per visitor in 30-minute windows. Purchases
          come from paid orders. These measures can differ across devices and blocked analytics.
        </p>
        <div className="funnel">
          {[
            ['Visit', visits],
            ['Listen', plays],
            ['Checkout', checkouts],
            ['Purchase', orders.length],
          ].map(([name, n]) => (
            <div key={name}>
              <span>{name}</span>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, (Number(n) / Math.max(1, visits)) * 100))}%`,
                }}
              />
              <strong>{n}</strong>
            </div>
          ))}
        </div>
        <p>
          Revenue: {money(orders.reduce((sum, o) => sum + o.amount_cents, 0))} · Orders per visit:{' '}
          {visits ? ((orders.length / visits) * 100).toFixed(1) : '0'}%
        </p>
      </section>
      <section className="panel tools-panel">
        <h2>Traffic sources</h2>
        <p className="muted text-sm">
          Share /{data.store.username}?utm_source=instagram to measure a campaign. Only a source
          label is stored, never full referral URLs.
        </p>
        <div className="tools-table-wrap">
          <table className="tools-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Visits</th>
                <th>Checkout starts</th>
                <th>Sales</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td>{events.filter((e) => e.kind === 'visit' && e.source === s).length}</td>
                  <td>{events.filter((e) => e.kind === 'checkout' && e.source === s).length}</td>
                  <td>{orders.filter((o) => (o.source || 'direct') === s).length}</td>
                  <td>
                    {money(
                      orders
                        .filter((o) => (o.source || 'direct') === s)
                        .reduce((a, o) => a + o.amount_cents, 0),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
export function Collaborators({ data }: { data: Workspace }) {
  const router = useRouter();
  const [tools, setTools] = useState(data.tools || emptyTools()),
    [beatId, setBeatId] = useState(data.beats[0]?.id || ''),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [percent, setPercent] = useState('25'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function save(next: ProducerTools) {
    setBusy(true);
    setError('');
    try {
      await post('/api/tools', next);
      setTools(next);
      setMessage('Collaborator splits saved.');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const ledger = collaboratorLedger(data.orders);
  return (
    <>
      <PageHeading
        eyebrow="MADE TOGETHER"
        title="Collaborator splits."
        description="Allocate co-producer shares and keep an accurate earnings ledger."
      >
        <a download href="/api/tools?export=splits" className="button">
          Export splits CSV
        </a>
      </PageHeading>
      <Notice>
        Shares apply to producer earnings after the platform fee. Each sale snapshots its
        collaborators; later edits never change past earnings. This ledger records amounts owed—bank
        payouts are not automated.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="tools-columns">
        <section className="panel tools-panel">
          <h2>Add a collaborator</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save({
                ...tools,
                collaborators: [
                  ...tools.collaborators,
                  {
                    id: crypto.randomUUID(),
                    beat_id: beatId,
                    name,
                    email,
                    percent: Number(percent),
                  },
                ],
              });
            }}
          >
            <Field label="Beat">
              <select value={beatId} onChange={(e) => setBeatId(e.target.value)}>
                {data.beats.map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Collaborator name">
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Collaborator email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Share of producer earnings (%)">
              <input
                required
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </Field>
            <Button className="primary" busy={busy} disabled={!beatId}>
              Add collaborator
            </Button>
          </form>
          <div className="tool-list">
            {tools.collaborators.map((c) => (
              <div key={c.id}>
                <div>
                  <strong>
                    {c.name} / {c.percent}%
                  </strong>
                  <small>
                    {data.beats.find((b) => b.id === c.beat_id)?.title} · {c.email}
                  </small>
                </div>
                <Button
                  className="small"
                  onClick={() =>
                    save({
                      ...tools,
                      collaborators: tools.collaborators.filter((x) => x.id !== c.id),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel tools-panel">
          <h2>Amounts owed</h2>
          {ledger.length ? (
            <div className="tool-list">
              {ledger.map((c) => (
                <div key={c.id}>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.email} · {c.sales} sales
                    </small>
                  </div>
                  <strong>{money(c.amount_cents)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Your first shared sale."
              description="Completed purchases will appear here. Refunded purchases are excluded."
            />
          )}
          <p className="muted text-sm">
            Producer remainder:{' '}
            {money(
              data.orders
                .filter((o) => o.status === 'paid')
                .reduce((sum, o) => sum + o.earnings_cents, 0) -
                ledger.reduce((sum, c) => sum + c.amount_cents, 0),
            )}
          </p>
        </section>
      </div>
    </>
  );
}
