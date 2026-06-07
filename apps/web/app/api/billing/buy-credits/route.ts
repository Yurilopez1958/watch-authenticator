import { getStripe, getAdmin, getUserId } from '@/lib/server/clients';
import { STRIPE_PRICE_CREDITS, CREDITS_PER_PACK } from '@/lib/plans';
import { ERRORS, errorResponse } from '@/lib/server/errors';

/** One-time Checkout to buy credit packs. Body: { packs?: number }. */
export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    if (!STRIPE_PRICE_CREDITS) return Response.json({ error: 'credits_not_configured' }, { status: 503 });

    const { packs } = (await req.json().catch(() => ({}))) as { packs?: number };
    const qty = Math.max(1, Math.min(100, Math.floor(packs ?? 1)));
    const credits = qty * CREDITS_PER_PACK;

    const stripe = getStripe();
    const admin = getAdmin();
    const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).single();
    let customerId = sub?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const { data: prof } = await admin.from('profiles').select('email').eq('id', userId).single();
      const customer = await stripe.customers.create({ ...(prof?.email ? { email: prof.email } : {}), metadata: { user_id: userId } });
      customerId = customer.id;
      await admin.from('subscriptions').upsert({ user_id: userId, stripe_customer_id: customerId });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_CREDITS, quantity: qty }],
      success_url: `${appUrl}/billing?credits=1`,
      cancel_url: `${appUrl}/billing?canceled=1`,
      metadata: { user_id: userId, kind: 'credits', credits: String(credits) },
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}
