/**
 * Contact / meeting-request form. Sends mail via Resend.
 * Rate limited per IP via durable Upstash counter (3 / hour).
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAndRecord, getClientIp } from '@/lib/rateLimit';

const MAX_PER_HOUR = 3;
const WINDOW_SECONDS = 3600;

function sanitize(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  // Strip HTML tags and script-injection vectors. Email is rendered as HTML,
  // so we DO need to keep this strict.
  return s
    .slice(0, max)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/** HTML-escape for safe interpolation into the email template. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(e: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e);
}

async function sendEmail(subject: string, html: string, replyTo: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL ?? 'info@desuisse.com';

  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY not set');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'deSuisse Website <noreply@desuisse.com>',
        to: [toEmail],
        reply_to: replyTo,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      console.error('[contact] Resend error:', res.status, data);
      // Carry Resend's OWN message through. `Resend 422` told us the request
      // was rejected but not why — and "why" is the whole diagnostic (an
      // unverified domain, a from-address that isn't on it, a bad recipient).
      // The message names no key and no customer data, so it is safe to return.
      const reason = typeof data.message === 'string' ? data.message
        : typeof data.error === 'string' ? data.error
        : JSON.stringify(data).slice(0, 300);
      return { ok: false, error: `Resend ${res.status}: ${reason}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[contact] Network error:', err);
    return { ok: false, error: String(err) };
  }
}

export async function POST(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  const ip = getClientIp(req);
  const limit = await checkAndRecord({
    key: `contact:${ip}`,
    max: MAX_PER_HOUR,
    windowSeconds: WINDOW_SECONDS,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, {
      status: 429, headers: { 'Retry-After': String(Math.ceil(limit.remainingMs / 1000)) },
    });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name    = sanitize(b.name, 100);
  const email   = sanitize(b.email, 254).toLowerCase();
  const phone   = typeof b.phone === 'string' ? b.phone.slice(0, 32).replace(/[^0-9+\-\s()]/g, '') : '';
  const message = sanitize(b.message, 2000);
  const type    = sanitize(b.type, 20) || 'contact';

  if (!name)                          return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (!isValidEmail(email))           return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  if (!message || message.length < 2) return NextResponse.json({ error: 'Message too short' }, { status: 400 });

  const isMeeting = type === 'meeting';
  const subject = isMeeting
    ? `📅 New Meeting Request — ${name}`
    : `✉️ New Contact Message — ${name}`;

  // ALL user input is HTML-escaped before being interpolated into the email body.
  const eName = escapeHtml(name);
  const eEmail = escapeHtml(email);
  const ePhone = escapeHtml(phone);
  const eMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#1a0a0a;padding:20px 24px;margin-bottom:24px">
        <h1 style="color:#c9a84c;margin:0;font-size:20px;font-weight:400;letter-spacing:2px">
          ${isMeeting ? 'MEETING REQUEST' : 'CONTACT MESSAGE'}
        </h1>
        <p style="color:#888;margin:6px 0 0;font-size:12px">deSuisse Website — desuisse.com</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:12px;width:100px">NAME</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#1a0a0a"><strong>${eName}</strong></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:12px">EMAIL</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px"><a href="mailto:${eEmail}" style="color:#c9a84c">${eEmail}</a></td></tr>
        ${phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:12px">PHONE</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#1a0a0a">${ePhone}</td></tr>` : ''}
      </table>
      <div style="margin-top:24px;padding:16px;background:#f7f3ee;border-left:3px solid #c9a84c">
        <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">MESSAGE</p>
        <p style="margin:0;font-size:14px;color:#1a0a0a;line-height:1.7">${eMessage}</p>
      </div>
      <p style="margin-top:24px;font-size:11px;color:#bbb;text-align:center">
        Sent from desuisse.com — Reply directly to <a href="mailto:${eEmail}" style="color:#c9a84c">${eEmail}</a>
      </p>
    </div>
  `;

  const emailResult = await sendEmail(subject, html, email);

  // A failed send used to fall through to `success: true`. The customer was
  // told "Message sent!", the enquiry went nowhere, and nobody found out —
  // every contact made while RESEND_API_KEY was unset was lost in silence.
  // Failing loudly is the only honest option: the customer can then phone or
  // use WhatsApp instead of waiting for a reply that will never come.
  if (!emailResult.ok) {
    console.error('[contact] Email failed:', emailResult.error);
    return NextResponse.json({
      error: 'We could not send your message right now. Please call us or write to info@desuisse.com.',
      detail: emailResult.error,
    }, { status: 502 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
