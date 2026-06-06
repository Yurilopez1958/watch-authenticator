import type Stripe from 'stripe';
import { getStripe, getAdmin } from '@/lib/server/clients';
import { planFromPriceId, GRACE_DAYS } from '@/lib/plans';

// App Router handlers receive the RAW body via req.text() — required to verify
// the Stripe signature.
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response('Webhook not configured', { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  const admin = getAdmin();

  // Idempotency: skip events we've already processed.
  const { error: dup } = await admin.from('webhook_events').insert({ id: event.id, type: event.type });
  if (dup) return new Response('ok (dup)', { status: 200 });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = await resolveSubscription(event);
        if (sub) await upsertFromSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await admin.from('subscriptions').update({
          plan: 'free', status: 'canceled', stripe_subscription_id: null,
          current_period_end: null, cancel_at_period_end: false, updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', sub.customer as string);
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        await admin.from('subscriptions').update({
          status: 'past_due',
          grace_until: new Date(Date.now() + GRACE_DAYS * 864e5).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', inv.customer as string);
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        const userId = await userIdByCustomer(inv.customer as string);
        await admin.from('payments').upsert({
          id: inv.id, user_id: userId, amount_cents: inv.amount_paid,
          currency: inv.currency, status: 'paid',
          description: inv.lines.data[0]?.description ?? null,
        });
        await admin.from('subscriptions').update({ grace_until: null })
          .eq('stripe_customer_id', inv.customer as string);
        break;
      }
    }
  } catch (e) {
    console.error('webhook handler error', e);
    return new Response('handler error', { status: 500 }); // Stripe will retry
  }
  return new Response('ok', { status: 200 });
}

async function resolveSubscription(event: Stripe.Event): Promise<Stripe.Subscription | null> {
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    if (!s.subscription) return null;
    return getStripe().subscriptions.retrieve(s.subscription as string);
  }
  return event.data.object as Stripe.Subscription;
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id ?? null;
  // `current_period_end` location varies across Stripe API versions; read it
  // defensively (top level, else the first item's period end).
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end ??
    null;
  await getAdmin().from('subscriptions').update({
    plan: planFromPriceId(priceId),
    status: sub.status,
    stripe_subscription_id: sub.id,
    current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    grace_until: null,
    updated_at: new Date().toISOString(),
  }).eq('stripe_customer_id', sub.customer as string);
}

async function userIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await getAdmin().from('subscriptions')
    .select('user_id').eq('stripe_customer_id', customerId).single();
  return data?.user_id ?? null;
}
