/**
 * POST /api/auth/forgot-password
 * Body: { email, language? }
 *
 * Security:
 *   - ALWAYS returns 200 with a generic message, whether the email exists
 *     or not (prevents enumeration via this endpoint).
 *   - Rate-limited per IP and per email.
 *   - The actual reset link is only generated and emailed if the user
 *     exists; otherwise we silently do nothing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, normalizeEmail } from '@/lib/auth';
import { getUserByEmail, createResetToken } from '@/lib/userStore';
import { passwordResetEmail, sendEmail } from '@/lib/emailTemplates';
import { checkAndRecord, getClientIp } from '@/lib/rateLimit';

const GENERIC_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';

export async function POST(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  const ip = getClientIp(req);
  const ipRl = await checkAndRecord({
    key: `forgot-pw-ip:${ip}`,
    max: 5,
    windowSeconds: 60 * 60,
  });
  if (!ipRl.allowed) {
    // Still return the generic message — no info leak even on rate limit
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  let body: { email?: string; language?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const language: 'en' | 'sq' = body.language === 'sq' ? 'sq' : 'en';

  if (typeof body.email !== 'string' || !isValidEmail(body.email)) {
    // Even malformed emails get the same response — prevents probing
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const email = normalizeEmail(body.email);

  // Per-email rate limit: 3 resets per hour
  const emailRl = await checkAndRecord({
    key: `forgot-pw-email:${email}`,
    max: 3,
    windowSeconds: 60 * 60,
  });
  if (!emailRl.allowed) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    // Generic response prevents enumeration
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const token = await createResetToken(user.id);
  if (!token) {
    console.error('[forgot-password] token generation failed');
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://desuisse.com' : req.nextUrl.origin;
  const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;
  const email_ = passwordResetEmail({ name: user.name, resetUrl, language });
  await sendEmail({ to: user.email, subject: email_.subject, html: email_.html });

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
