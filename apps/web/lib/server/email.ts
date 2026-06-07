// Transactional email via Resend (https://resend.com) using plain fetch — no SDK.
// Fully no-op (and never throws) when RESEND_API_KEY is not configured.

const ENDPOINT = 'https://api.resend.com/emails';

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(to: string | null | undefined, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Watch Authenticator <onboarding@resend.dev>';
  if (!key || !to) return; // graceful no-op
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (e) {
    console.warn('email send failed:', (e as Error).message);
  }
}

/** Minimal bilingual wrapper so emails read in both languages. */
export function biHtml(es: string, en: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">
    <p>${es}</p><hr style="border:none;border-top:1px solid #eee"/><p style="color:#666">${en}</p>
    <p style="color:#999;font-size:12px;margin-top:16px">Watch Authenticator</p></div>`;
}
