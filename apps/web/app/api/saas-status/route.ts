// Reports which SaaS env vars are present (booleans only — never the values).
// Used by the /setup page to verify configuration step by step.

export const runtime = 'nodejs';

export async function GET() {
  const has = (k: string) => !!process.env[k];
  return Response.json({
    saasEnabled: process.env.SAAS_ENABLED === 'true',
    core: {
      stripeSecret: has('STRIPE_SECRET_KEY'),
      stripeWebhook: has('STRIPE_WEBHOOK_SECRET'),
      supabaseServiceRole: has('SUPABASE_SERVICE_ROLE_KEY'),
      supabaseUrl: has('SUPABASE_URL') || has('NEXT_PUBLIC_SUPABASE_URL'),
      appUrl: has('NEXT_PUBLIC_APP_URL'),
      ai: has('ANTHROPIC_API_KEY'),
    },
    plans: {
      proMonthly: has('STRIPE_PRICE_PRO'),
      businessMonthly: has('STRIPE_PRICE_BUSINESS'),
      proYearly: has('STRIPE_PRICE_PRO_YEAR'),
      businessYearly: has('STRIPE_PRICE_BUSINESS_YEAR'),
      credits: has('STRIPE_PRICE_CREDITS'),
    },
    email: {
      resend: has('RESEND_API_KEY'),
      from: has('EMAIL_FROM'),
      adminEmail: has('ADMIN_EMAIL'),
    },
  });
}
