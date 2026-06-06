import { getStripe, getAdmin, getUserId } from '@/lib/server/clients';
import { ERRORS, errorResponse } from '@/lib/server/errors';

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    const { data: sub } = await getAdmin().from('subscriptions')
      .select('stripe_customer_id').eq('user_id', userId).single();
    if (!sub?.stripe_customer_id) return Response.json({ error: 'no_customer' }, { status: 400 });

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/billing`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}
