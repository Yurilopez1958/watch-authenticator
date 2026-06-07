import { getStripe, getAdmin, getUserId } from '@/lib/server/clients';
import { priceIdFor, type PlanId, type BillingInterval } from '@/lib/plans';
import { ERRORS, errorResponse } from '@/lib/server/errors';

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    const { plan, interval } = (await req.json().catch(() => ({}))) as { plan?: PlanId; interval?: BillingInterval };
    const priceId = plan ? priceIdFor(plan, interval === 'year' ? 'year' : 'month') : null;
    if (!priceId) return Response.json({ error: 'invalid_plan' }, { status: 400 });

    const stripe = getStripe();
    const admin = getAdmin();

    const { data: sub } = await admin.from('subscriptions')
      .select('stripe_customer_id').eq('user_id', userId).single();
    let customerId: string | undefined = sub?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const { data: prof } = await admin.from('profiles').select('email').eq('id', userId).single();
      const customer = await stripe.customers.create({
        ...(prof?.email ? { email: prof.email } : {}),
        metadata: { user_id: userId },
      });
      customerId = customer.id;
      await admin.from('subscriptions').upsert({ user_id: userId, stripe_customer_id: customerId });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing?canceled=1`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      subscription_data: { metadata: { user_id: userId } },
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}
