'use client';
import { useState } from 'react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import type { Beat, License } from '@/lib/types';
import { money } from '@/lib/business';
import { post } from '@/lib/client';
import { DiscountCode, sourceForStore, type Quote } from './store-tools';
import { Modal, Field, Button, Notice } from './ui';
export function LicenseSelector({
  beat,
  username,
  licenses,
  demo,
  onClose,
  disabled,
}: {
  beat: Beat;
  username: string;
  licenses: License[];
  demo: boolean;
  onClose: () => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState(
      [...licenses].sort((a, b) => a.price_cents - b.price_cents)[0]?.id || '',
    ),
    [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [code, setCode] = useState(''),
    [quote, setQuote] = useState<Quote | null>(null);
  const license = licenses.find((l) => l.id === selected);
  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) {
      setError(
        'Checkout is disabled in the store editor preview. Open your public store to purchase.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await post<{ url: string }>('/api/checkout', {
        beat_id: beat.id,
        license_id: selected,
        email,
        code,
        source: sourceForStore(username),
      });
      window.location.assign(result.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal title="Make it your next record." onClose={onClose}>
      <form onSubmit={checkout}>
        <div className="purchase-beat">
          <img src={beat.cover_url || '/demo/cover-1.svg'} alt="" />
          <div>
            <h3>{beat.title}</h3>
            <p>
              {beat.bpm} BPM · {beat.musical_key}
            </p>
          </div>
        </div>
        <fieldset className="license-options">
          <legend>Choose your license</legend>
          {licenses.map((l) => (
            <label key={l.id} className={`license-option ${selected === l.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="license"
                value={l.id}
                checked={selected === l.id}
                onChange={() => {
                  setSelected(l.id);
                  setQuote(null);
                  setCode('');
                }}
              />
              <span>
                <strong>{l.name}</strong>
                <small>
                  {l.deliverables
                    .map((d) => (d === 'stems' ? 'Stems ZIP' : d.toUpperCase()))
                    .join(' + ')}
                </small>
              </span>
              <b>{money(l.price_cents)}</b>
              {selected === l.id && <Check size={16} />}
            </label>
          ))}
        </fieldset>
        {license && (
          <details className="license-terms">
            <summary>Read the license terms</summary>
            <p>{license.terms}</p>
          </details>
        )}
        <DiscountCode
          key={selected}
          payload={{ beat_id: beat.id, license_id: selected }}
          disabled={disabled}
          onQuote={(q, c) => {
            setQuote(q.amount_cents ? q : null);
            setCode(c);
          }}
        />
        {quote && (
          <p className="quote-total">
            Total: {money(quote.amount_cents)}
            <small>Save {money(quote.discount_cents)}</small>
          </p>
        )}
        <Field
          label="Your email"
          hint="Your files and license will be available immediately after payment."
        >
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {demo && <Notice>Demo checkout. No card is requested and no money is charged.</Notice>}
        {error && <Notice error>{error}</Notice>}
        <Button className="primary full" busy={busy} disabled={!license} type="submit">
          {demo ? 'Complete demo purchase' : 'Continue to secure checkout'}
          <ArrowRight size={16} />
        </Button>
        <p className="checkout-note">
          <ShieldCheck size={13} />{' '}
          {demo
            ? 'Sandbox purchase · Instant demo downloads'
            : 'Secure payment · No account required'}
        </p>
      </form>
    </Modal>
  );
}
