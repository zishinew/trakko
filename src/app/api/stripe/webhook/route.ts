import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripeClient } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/server';
import { shouldFulfill } from '@/lib/business';
import { deliverReceipts } from '@/lib/email';
import { demoMode } from '@/lib/config';
export async function POST(request: Request) {
  if (demoMode) return new Response('Stripe is disabled in demo mode', { status: 503 });
  const signature = request.headers.get('stripe-signature');
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
    return new Response('Missing signature or configuration', { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response('Invalid webhook signature', { status: 400 });
  }
  const db = supabaseAdmin();
  try {
    if (
      ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(
        event.type,
      )
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const id = session.metadata?.order_id;
      if (!id) return NextResponse.json({ received: true });
      const { data: order, error } = await db.from('orders').select('*').eq('id', id).single();
      if (error || !order) throw new Error('Order missing; retry webhook');
      if (order.status === 'refunded') return NextResponse.json({ received: true });
      if (!order.stripe_session_id) throw new Error('Checkout session not saved; retry webhook');
      if (order.stripe_session_id !== session.id) throw new Error('Checkout session mismatch');
      if (
        order.status === 'pending' &&
        session.payment_status === 'paid' &&
        !shouldFulfill(order, session.amount_total, session.currency, session.payment_status)
      )
        throw new Error('Paid checkout amount or currency mismatch');
      if (shouldFulfill(order, session.amount_total, session.currency, session.payment_status)) {
        const paymentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null;
        // A compare-and-set update is atomic. Duplicates, retries, and concurrent
        // webhook deliveries cannot fulfill or overwrite the same order twice.
        const { error: e } = await db
          .from('orders')
          .update({
            status: 'paid',
            fulfillment_status: 'ready',
            paid_at: new Date().toISOString(),
            stripe_payment_id: paymentId,
          })
          .eq('id', id)
          .eq('status', 'pending');
        if (e) throw e;
      }
    }
    if (event.type === 'account.updated') {
      // Retrieve current account state so older events cannot regress its status.
      const account = await stripeClient().accounts.retrieve(
        (event.data.object as Stripe.Account).id,
      );
      const { error } = await db
        .from('stripe_accounts')
        .update({
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        })
        .eq('account_id', account.id);
      if (error) throw error;
    }
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      if (charge.refunded && typeof charge.payment_intent === 'string') {
        const payment = await stripeClient().paymentIntents.retrieve(charge.payment_intent);
        const orderId = payment.metadata.order_id;
        if (orderId) {
          const { error } = await db
            .from('orders')
            .update({
              status: 'refunded',
              fulfillment_status: 'pending',
              stripe_payment_id: payment.id,
            })
            .eq('id', orderId);
          if (error) throw error;
        }
      }
    }
    // Paid-order trigger durably queues the receipt. Provider failure does not undo settlement.
    try {
      await deliverReceipts(1);
    } catch {
      console.error('Receipt worker will retry queued mail');
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook failed', e);
    return new Response('Webhook processing failed', { status: 500 });
  }
}
