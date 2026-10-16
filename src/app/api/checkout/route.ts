import { NextResponse } from 'next/server';
import { randomUUID, randomBytes } from 'node:crypto';
import { assertOrigin, apiError } from '@/lib/http';
import { appUrl, demoMode, feeBasisPoints } from '@/lib/config';
import { demoSession, mutateDemo } from '@/lib/demo';
import { checkoutCatalog } from '@/lib/data';
import { checkoutSchema } from '@/lib/validation';
import { stripeClient } from '@/lib/stripe';
import { hashToken } from '@/lib/purchase';
import { encryptReceipt } from '@/lib/email';
import { emptyTools, pricePurchase } from '@/lib/tools';
import { getTools, recordEvent, safeSource } from '@/lib/tools-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Order, Store, Workspace } from '@/lib/types';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = checkoutSchema.parse(await request.json());
    const id = randomUUID(),
      token = randomBytes(32).toString('hex');
    const purchaseUrl = `${appUrl()}/purchase/${id}?token=${token}`;
    function makeOrder(
      store: Store,
      state: Pick<Workspace, 'beats' | 'licenses' | 'files' | 'tools'>,
    ): Order {
      const priced = pricePurchase(
        input,
        state.beats,
        state.licenses,
        state.files,
        state.tools || emptyTools(),
        feeBasisPoints(),
      );
      const first = priced.items[0];
      return {
        id,
        store_id: store.id,
        beat_id: first.beat_id,
        license_id: first.license_id,
        customer_email: input.email.toLowerCase(),
        ...priced,
        currency: 'usd',
        beat_title: priced.items.map((i) => i.beat_title).join(' + '),
        producer_name: store.display_name,
        license_name: priced.bundle_name
          ? `${priced.bundle_name} · ${first.license_name}`
          : first.license_name,
        license_terms: priced.items
          .map((i) => `${i.beat_title} — ${i.license_name}\n${i.license_terms}`)
          .join('\n\n'),
        deliverables: [...new Set(priced.items.flatMap((i) => i.deliverables))],
        status: 'pending',
        fulfillment_status: 'pending',
        stripe_session_id: null,
        stripe_payment_id: null,
        token_hash: hashToken(token),
        created_at: new Date().toISOString(),
        paid_at: null,
        source: safeSource(input.source),
        receipt_ciphertext: demoMode ? '' : encryptReceipt(purchaseUrl),
      };
    }
    if (demoMode) {
      const session = await demoSession(true);
      const order = await mutateDemo(session, (s) => {
        if (!s.store.published) throw new Error('Store unavailable');
        const o = makeOrder(s.store, s);
        o.status = 'paid';
        o.fulfillment_status = 'ready';
        o.paid_at = new Date().toISOString();
        s.orders.push(o);
        s.mail_jobs ||= [];
        s.mail_jobs.push({
          id: randomUUID(),
          order_id: o.id,
          store_id: s.store.id,
          status: 'demo',
          attempts: 0,
          last_error: 'Demo email preview only; no email was sent.',
          created_at: o.created_at,
          sent_at: null,
          locked_at: null,
        });
        return o;
      });
      await recordEvent(order.store_id, 'checkout', input.source || 'direct', order.beat_id).catch(
        () => console.error('Checkout analytics could not be recorded'),
      );
      return NextResponse.json({ url: purchaseUrl, demo: true });
    }
    let firstId = input.beat_id;
    // Bundle lookup returns only a server-side config. Client amounts never influence pricing.
    const admin = supabaseAdmin();
    if (input.bundle_id) {
      // A bundle can be located via its public store username, never by scanning other stores.
      const username = new URL(request.url).searchParams.get('store');
      if (!username) throw new Error('Store unavailable');
      const { data: store } = await admin
        .from('stores')
        .select('*')
        .eq('username', username)
        .eq('published', true)
        .maybeSingle();
      if (!store) throw new Error('Store unavailable');
      const tools = await getTools(store.id);
      firstId = tools.bundles.find((b) => b.id === input.bundle_id && b.active)?.beat_ids[0];
    }
    if (!firstId) throw new Error('Beat unavailable');
    const ctx = await checkoutCatalog(firstId);
    const tools = await getTools(ctx.store.id);
    const { data: beats, error: beatError } = await admin
      .from('beats')
      .select('*')
      .eq('store_id', ctx.store.id);
    if (beatError) throw beatError;
    const { data: files, error: fileError } = await admin
      .from('beat_files')
      .select('*')
      .eq('store_id', ctx.store.id);
    if (fileError) throw fileError;
    const { data: connection } = await admin
      .from('stripe_accounts')
      .select('*')
      .eq('store_id', ctx.store.id)
      .maybeSingle();
    if (!connection) throw new Error('Payments are not enabled for this store yet');
    const stripe = stripeClient();
    const account = await stripe.accounts.retrieve(connection.account_id);
    if (!account.charges_enabled || !account.payouts_enabled)
      throw new Error('Payments are not enabled for this store yet');
    const order = makeOrder(ctx.store, {
      beats: beats || [],
      licenses: ctx.licenses,
      files: files || [],
      tools,
    });
    const { error } = await admin.from('orders').insert(order);
    if (error) throw error;
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: order.customer_email,
        client_reference_id: id,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: order.amount_cents,
              product_data: {
                name: order.bundle_name || `${order.beat_title} · ${order.license_name}`,
                description: `Produced by ${ctx.store.display_name}`,
              },
            },
          },
        ],
        payment_intent_data: {
          on_behalf_of: account.id,
          application_fee_amount: order.fee_cents,
          transfer_data: { destination: account.id },
          metadata: { order_id: id, store_id: ctx.store.id },
        },
        metadata: { order_id: id, store_id: ctx.store.id },
        success_url: purchaseUrl,
        cancel_url: `${appUrl()}/${ctx.store.username}?checkout=canceled`,
      },
      { idempotencyKey: `checkout-${id}` },
    );
    const { error: saveError } = await admin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', id)
      .eq('status', 'pending');
    if (saveError) throw saveError;
    await recordEvent(ctx.store.id, 'checkout', input.source || 'direct', order.beat_id).catch(() =>
      console.error('Checkout analytics could not be recorded'),
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
