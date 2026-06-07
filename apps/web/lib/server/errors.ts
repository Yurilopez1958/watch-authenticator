export type ApiErrorCode =
  | 'unauthorized' | 'payment_required' | 'limit_reached'
  | 'device_limit' | 'account_blocked' | 'forbidden';

type Bi = { es: string; en: string };

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public status: number,
    public payload: { title: Bi; message: Bi; cta?: string },
  ) { super(code); }
}

export const ERRORS = {
  unauthorized: () => new ApiError('unauthorized', 401, {
    title: { es: 'Inicia sesión', en: 'Sign in' },
    message: { es: 'Necesitas iniciar sesión para continuar.', en: 'You need to sign in to continue.' },
  }),
  paymentRequired: () => new ApiError('payment_required', 402, {
    title: { es: 'Suscripción pausada', en: 'Subscription paused' },
    message: { es: 'Tu suscripción está pausada por un pago pendiente. Actualiza tu método de pago para seguir usando la app.', en: 'Your subscription is paused due to a pending payment. Update your payment method to keep using the app.' },
    cta: '/billing',
  }),
  limitReached: (kind: 'auth' | 'valuation', limit: number) => new ApiError('limit_reached', 429, {
    title: { es: 'Límite mensual alcanzado', en: 'Monthly limit reached' },
    message: {
      es: `Has llegado a tu límite de ${limit} ${kind === 'auth' ? 'autenticaciones' : 'valuaciones'} este mes. Sube de plan o espera al próximo mes.`,
      en: `You reached your limit of ${limit} ${kind === 'auth' ? 'authentications' : 'valuations'} this month. Upgrade your plan or wait until next month.`,
    },
    cta: '/billing',
  }),
  deviceLimit: (n: number) => new ApiError('device_limit', 403, {
    title: { es: 'Demasiados dispositivos', en: 'Too many devices' },
    message: { es: `Tu plan permite ${n} dispositivo(s). Cierra sesión en otro dispositivo o sube de plan.`, en: `Your plan allows ${n} device(s). Sign out on another device or upgrade.` },
    cta: '/billing',
  }),
  accountBlocked: () => new ApiError('account_blocked', 403, {
    title: { es: 'Cuenta bloqueada', en: 'Account blocked' },
    message: { es: 'Tu cuenta está bloqueada por actividad sospechosa. Contacta con soporte.', en: 'Your account is blocked due to suspicious activity. Contact support.' },
  }),
  forbidden: () => new ApiError('forbidden', 403, {
    title: { es: 'Sin permiso', en: 'Forbidden' },
    message: { es: 'Solo administradores.', en: 'Admins only.' },
  }),
};

/** Serialises any error to a JSON Response. */
export function errorResponse(e: unknown): Response {
  if (e instanceof ApiError) {
    return Response.json({ error: e.code, ...e.payload }, { status: e.status });
  }
  console.error(e);
  return Response.json(
    { error: 'server_error', detail: e instanceof Error ? e.message : String(e) },
    { status: 500 },
  );
}
