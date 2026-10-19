/**
 * POST /api/auth/signup
 * Body: { email, password, name, language? }
 *
 * Flow:
 *   1. Validate input (email format, password strength, name length)
 *   2. Rate-limit by IP to prevent signup spam
 *   3. Hash password with bcrypt
 *   4. Atomically create user (fails if email taken)
 *   5. Generate email verification token
 *   6. Send verification email
 *   7. Return success — account is NOT logged in until email is verified
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  hashPassword,
  isValidEmail,
  validatePassword,
  validateName,
  normalizeEmail,
} from '@/lib/auth';
import {
  createUser,
  createVerificationToken,
} from '@/lib/userStore';
import { verificationEmail, sendEmail } from '@/lib/emailTemplates';
import { checkAndRecord, getClientIp } from '@/lib/rateLimit';

// Rate limit: 5 signup attempts per IP per hour. Generous but stops abuse.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 60 * 60;

export async function POST(req: NextRequest) {
  // Reject non-JSON content type
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  const ip = getClientIp(req);
  const rl = await checkAndRecord({
    key: `signup:${ip}`,
    max: RATE_LIMIT_MAX,
    windowSeconds: RATE_LIMIT_WINDOW_SEC,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string; name?: string; language?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { email, password, name } = body;
  const language: 'en' | 'sq' = body.language === 'sq' ? 'sq' : 'en';

  // ── Validate input ──
  if (typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  const nameCheck = validateName(name ?? '');
  if (!nameCheck.valid) {
    return NextResponse.json({ error: nameCheck.reason }, { status: 400 });
  }
  const pwCheck = validatePassword(password ?? '');
  if (!pwCheck.valid) {
    return NextResponse.json({ error: pwCheck.reason }, { status: 400 });
  }

  // ── Hash password (slow, ~250ms) ──
  const passwordHash = await hashPassword(password!);

  // ── Atomically create user. Returns null if email is taken. ──
  const user = await createUser({
    email: normalizeEmail(email),
    name: name!,
    passwordHash,
  });

  if (!user) {
    // Intentionally vague — don't confirm whether the email exists,
    // to prevent enumeration attacks.
    return NextResponse.json(
      { error: 'Could not create account. The email may already be registered.' },
      { status: 409 }
    );
  }

  // ── Generate verification token + send email ──
  const token = await createVerificationToken(user.id);
  if (!token) {
    // We managed to create the account but couldn't generate a token.
    // This is recoverable: customer can request resend later.
    console.error('[signup] token generation failed for user', user.id);
    return NextResponse.json({
      success: true,
      pendingVerification: true,
      message: 'Account created but verification email could not be sent. Please contact support.',
    }, { status: 201 });
  }

  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://desuisse.com' : req.nextUrl.origin;
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const email_ = verificationEmail({ name: user.name, verifyUrl, language });
  const sent = await sendEmail({ to: user.email, subject: email_.subject, html: email_.html });

  if (!sent) {
    console.error('[signup] email send failed for', user.email);
    // Account exists, just couldn't send. Customer can re-request from the verify page.
  }

  return NextResponse.json({
    success: true,
    pendingVerification: true,
    message: 'Account created. Please check your email to verify your address.',
  }, { status: 201 });
}
