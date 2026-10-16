'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, RefreshCw, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';
import type { Workspace } from '@/lib/types';
import { post } from '@/lib/client';
import { PageHeading } from './dashboard-shell';
import { Button, Notice } from './ui';
import { LicenseEditor } from './license-editor';
export function Settings({
  data,
  demo,
  feePercent,
}: {
  data: Workspace;
  demo: boolean;
  feePercent: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const router = useRouter();
  const connected = data.stripe?.charges_enabled && data.stripe?.payouts_enabled;
  async function connect(action: string) {
    setBusy(true);
    setError('');
    try {
      const result = await post<{ url?: string }>('/api/connect', { action });
      if (result.url) window.location.assign(result.url);
      else router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="THE BUSINESS SIDE"
        title="Keep it simple."
        description="Payments, licenses, and the details that keep your store running."
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Payments & payouts</h2>
              <p>Get paid directly through Stripe Connect.</p>
            </div>
            <Wallet size={20} />
          </div>
          <div className="stripe-connection">
            <div className="stripe-wordmark">
              stripe<span>CONNECT</span>
            </div>
            <span className={`status-pill ${connected ? '' : 'inactive'}`}>
              {connected ? 'Connected' : data.stripe ? 'Setup incomplete' : 'Not connected'}
            </span>
          </div>
          <p className="muted">
            {connected
              ? 'Your store is ready to accept payments. Stripe handles your payouts and bank details.'
              : 'Connect your Stripe account to accept payments and receive your earnings. Onboarding only takes a few minutes.'}
          </p>
          <div className="fee-breakdown">
            <div>
              <span>Platform fee</span>
              <strong>{feePercent}% per completed sale</strong>
            </div>
            <div>
              <span>Monthly cost</span>
              <strong>$0. Always.</strong>
            </div>
            <p>
              Stripe processing fees, refunds, and disputes are charged to the platform for
              destination charges. Review the Stripe pricing for your region before launching.
            </p>
          </div>
          {demo && (
            <Notice>
              Stripe is disabled in the local demo. Configure your environment to connect a test
              account.
            </Notice>
          )}
          {error && <Notice error>{error}</Notice>}
          <div className="settings-actions">
            <Button
              className="primary"
              busy={busy}
              onClick={() => connect(connected ? 'portal' : 'onboarding')}
            >
              {connected ? 'Open Stripe dashboard' : 'Connect with Stripe'}
              <ArrowUpRight size={16} />
            </Button>
            {data.stripe && (
              <Button className="secondary" busy={busy} onClick={() => connect('refresh')}>
                <RefreshCw size={15} /> Refresh status
              </Button>
            )}
          </div>
        </section>
        <section className="panel settings-panel">
          <LicenseEditor licenses={data.licenses} />
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <h2>Account security</h2>
            <ShieldCheck size={19} />
          </div>
          <p className="muted">Keep your producer account secure with a strong, unique password.</p>
          <Link href="/update-password" className="button secondary">
            Change password <ArrowRight size={15} />
          </Link>
          <Link href="/reset-password" className="text-link muted reset-link">
            Send a password reset email <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </>
  );
}
