'use client';
import { useEffect, useState } from 'react';
import type { Beat, PublicCatalog } from '@/lib/types';
import type { Bundle } from '@/lib/tools';
import { money } from '@/lib/business';
import { post } from '@/lib/client';
import { Modal, Field, Button, Notice } from './ui';
export function sourceForStore(username: string) {
  try {
    return sessionStorage.getItem(`source:${username}`) || 'direct';
  } catch {
    return 'direct';
  }
}
export function StoreTracking({ username }: { username: string }) {
  useEffect(() => {
    let source = 'direct';
    try {
      const explicit = new URLSearchParams(location.search).get('utm_source');
      const ref = document.referrer ? new URL(document.referrer) : null;
      source =
        explicit ||
        (ref && ref.hostname !== location.hostname ? ref.hostname : sourceForStore(username));
      source = /^[a-zA-Z0-9_. -]{1,100}$/.test(source) ? source : 'direct';
      sessionStorage.setItem(`source:${username}`, source);
    } catch {}
    void post('/api/events', { username, source }).catch(() => {});
  }, [username]);
  return null;
}
export function FreeDownload({
  beat,
  username,
  onClose,
}: {
  beat: Beat;
  username: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(''),
    [consent, setConsent] = useState(false),
    [terms, setTerms] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [url, setUrl] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await post<{ url: string }>('/api/free-download', {
        username,
        beat_id: beat.id,
        email,
        marketing_consent: consent,
        accept_terms: terms,
        source: sourceForStore(username),
      });
      setUrl(result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Free preview / ${beat.title}`} onClose={onClose}>
      <p className="muted text-sm">
        Tagged MP3 preview for trying your ideas. Commercial release requires a paid license.
      </p>
      <p className="free-terms">
        {beat.free_download_terms ||
          'Non-commercial demo use only. Credit the producer. No distribution, resale, or Content ID registration.'}
      </p>
      {url ? (
        <>
          <Notice>
            Your preview is ready.{' '}
            {consent
              ? 'You also opted into producer updates.'
              : 'You have not subscribed to marketing.'}
          </Notice>
          <a className="button primary full" download href={url}>
            Download tagged MP3
          </a>
        </>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email for free download">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <label className="check-row">
            <input
              type="checkbox"
              required
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            I accept these free download terms
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Send me new beats and offers (optional)
          </label>
          {error && <Notice error>{error}</Notice>}
          <Button className="primary full" busy={busy} disabled={!terms}>
            Get free preview
          </Button>
        </form>
      )}
    </Modal>
  );
}
export type Quote = { subtotal_cents: number; discount_cents: number; amount_cents: number };
export function DiscountCode({
  payload,
  onQuote,
  disabled = false,
}: {
  payload: { beat_id?: string; license_id?: string; bundle_id?: string; username?: string };
  onQuote: (quote: Quote, code: string) => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function apply() {
    setBusy(true);
    setError('');
    try {
      const result = await post<Quote>(
        `/api/quote${payload.username ? `?store=${encodeURIComponent(payload.username)}` : ''}`,
        { ...payload, code },
      );
      onQuote(result, code);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="discount-control">
      <Field label="Discount code (optional)">
        <input
          value={code}
          maxLength={24}
          onChange={(e) => {
            setCode(e.target.value);
            onQuote({ subtotal_cents: 0, discount_cents: 0, amount_cents: 0 }, '');
          }}
          placeholder="Enter code"
        />
      </Field>
      <Button type="button" busy={busy} disabled={disabled} onClick={apply}>
        Apply code
      </Button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function BundleCheckout({
  bundle,
  catalog,
  demo,
  disabled,
  onClose,
}: {
  bundle: Bundle;
  catalog: PublicCatalog;
  demo: boolean;
  disabled: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [code, setCode] = useState(''),
    [quote, setQuote] = useState<Quote | null>(null);
  async function buy(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) {
      setError('Checkout is disabled in the store editor preview.');
      return;
    }
    setBusy(true);
    try {
      const result = await post<{ url: string }>(
        `/api/checkout?store=${encodeURIComponent(catalog.store.username)}`,
        { bundle_id: bundle.id, email, code, source: sourceForStore(catalog.store.username) },
      );
      window.location.assign(result.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal title={bundle.name} onClose={onClose}>
      <form onSubmit={buy}>
        <p className="muted text-sm">
          {bundle.beat_ids.length} beats · {bundle.license_name} · Separate licenses and files for
          every beat.
        </p>
        <div className="tool-list">
          {bundle.beat_ids.map((id) => {
            const beat = catalog.beats.find((b) => b.id === id);
            const license = catalog.licenses.find(
              (l) => l.beat_id === id && l.name === bundle.license_name,
            );
            return (
              <details key={id}>
                <summary>
                  {beat?.title || 'Unavailable beat'} / {bundle.license_name}
                </summary>
                <p className="free-terms">{license?.terms}</p>
              </details>
            );
          })}
        </div>
        <DiscountCode
          payload={{ bundle_id: bundle.id, username: catalog.store.username }}
          disabled={disabled}
          onQuote={(q, c) => {
            setQuote(q.amount_cents ? q : null);
            setCode(c);
          }}
        />
        <p className="quote-total">
          Total: {money(quote?.amount_cents ?? bundle.price_cents)}
          {quote && quote.discount_cents > 0 && <small>Save {money(quote.discount_cents)}</small>}
        </p>
        <Field label="Your email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {demo && <Notice>Demo checkout. No card is requested and no money is charged.</Notice>}
        {error && <Notice error>{error}</Notice>}
        <Button className="primary full" busy={busy} disabled={disabled}>
          {demo ? 'Complete demo purchase' : 'Continue to secure checkout'}
        </Button>
      </form>
    </Modal>
  );
}
