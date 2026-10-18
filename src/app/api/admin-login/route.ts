/**
 * Admin login.
 *
 * SECURITY FIXES vs the previous version:
 *  1. Session tokens are stored server-side in Upstash with TTL.
 *     Forged cookies (e.g. devtools-set 64-char strings) no longer pass.
 *  2. Rate limit state lives in Upstash, not an in-memory Map, so it
 *     survives Vercel cold starts.
 *  3. Constant-time password comparison via crypto.timingSafeEqual.
 *  4. httpOnly + Secure + SameSite=strict cookie.
 *
 * Setup notes for the operator:
 *  - ADMIN_PASSWORD: a long, random string. Set in Vercel env vars.
 *  - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN: required.
 *    Without these, login will refuse (we cannot persist sessions
 *    securely without a shared store).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session';
import { checkAndRecord, clear, getClientIp } from '@/lib/rateLimit';
import { isUpstashConfigured } from '@/lib/upstash';
import { verifyAdminUser } from '@/lib/adminUsers';

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;   // 15 minutes
const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours

function safeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  if (!isUpstashConfigured()) {
    console.error('[admin-login] Refusing to authenticate — Upstash not configured');
    return NextResponse.json(
      { error: 'Server not fully configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars.' },
      { status: 500 },
    );
  }

  const ip = getClientIp(req);
  const rateKey = `login:${ip}`;
  const limit = await checkAndRecord({ key: rateKey, max: MAX_ATTEMPTS, windowSeconds: WINDOW_SECONDS });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts', remainingMs: limit.remainingMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.remainingMs / 1000)) } },
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { password, username } = body as Record<string, unknown>;
  if (typeof password !== 'string' || password.length < 1 || password.length > 128) {
    return NextResponse.json({ error: 'Invalid credentials', attemptsLeft: limit.attemptsLeft }, { status: 401 });
  }
  if (username !== undefined && (typeof username !== 'string' || username.length > 32)) {
    return NextResponse.json({ error: 'Invalid credentials', attemptsLeft: limit.attemptsLeft }, { status: 401 });
  }

  const serverPwd = process.env.ADMIN_PASSWORD ?? '';
  if (!serverPwd) {
    console.error('[admin-login] ADMIN_PASSWORD not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const requestedUser = typeof username === 'string' ? username.trim() : '';
  const authenticatedUser = requestedUser === '' || requestedUser.toLowerCase() === 'lorik'
    ? (safeCompare(password, serverPwd) ? 'Lorik' : null)
    : await verifyAdminUser(requestedUser, password);
  if (!authenticatedUser) {
    return NextResponse.json({ error: 'Invalid credentials', attemptsLeft: limit.attemptsLeft }, { status: 401 });
  }

  // Success — clear the rate counter so the window resets for this IP
  await clear(rateKey);

  // Create a server-side session
  const token = await createSession(authenticatedUser);
  if (!token) {
    return NextResponse.json({ error: 'Could not create session. Check Upstash configuration.' }, { status: 500 });
  }

  const res = NextResponse.json({ success: true, username: authenticatedUser }, { status: 200 });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
  return res;
}
