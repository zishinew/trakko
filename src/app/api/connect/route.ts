import { NextResponse } from 'next/server';
import { assertOrigin, apiError } from '@/lib/http';
import { demoMode, appUrl } from '@/lib/config';
import { ownedStore } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase/server';
import { stripeClient } from '@/lib/stripe';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (demoMode)
      throw new Error(
        'Demo mode cannot connect Stripe. Configure Supabase and Stripe to receive payments',
      );
    const { store, user } = await ownedStore();
    const db = supabaseAdmin(),
      stripe = stripeClient();
    const { data: existing, error: lookupError } = await db
      .from('stripe_accounts')
      .select('*')
      .eq('store_id', store.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    const account = existing
      ? await stripe.accounts.retrieve(existing.account_id)
      : await stripe.accounts.create(
          {
            type: 'express',
            email: user.email,
            country: process.env.STRIPE_CONNECT_COUNTRY || undefined,
            capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
            metadata: { store_id: store.id },
          },
          { idempotencyKey: `connect-${store.id}` },
        );
    const { error } = await db.from('stripe_accounts').upsert({
      store_id: store.id,
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
    if (error) throw error;
    const { action } = await request.json();
    if (action === 'refresh') return NextResponse.json({ ok: true });
    if (action === 'portal' && account.details_submitted) {
      const link = await stripe.accounts.createLoginLink(account.id);
      return NextResponse.json({ url: link.url });
    }
    const link = await stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: `${appUrl()}/dashboard/settings?connect=refresh`,
      return_url: `${appUrl()}/dashboard/settings?connect=returned`,
    });
    return NextResponse.json({ url: link.url });
  } catch (e) {
    return apiError(e);
  }
}
