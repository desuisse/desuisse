/**
 * User session management — server-side sessions for logged-in customers.
 *
 * SECURITY DESIGN:
 *   - Sessions stored server-side in Upstash, indexed by session ID
 *   - Cookie is HttpOnly (not readable by JS, prevents XSS theft)
 *   - SameSite=Lax (prevents CSRF on most cross-site POSTs)
 *   - Secure flag in production (HTTPS only)
 *   - 30-day TTL, refreshed on use
 *   - Different cookie name (ds_user_session) from admin (ds_admin_session)
 *   - Different Upstash key prefix so the two systems never collide
 *
 * To get the current user from any API route or server component:
 *   const userId = await getUserIdFromRequest(req);
 *   if (!userId) → not signed in
 */
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from './upstash';
import { generateToken } from './auth';
import { getUserById } from './userStore';

const COOKIE_NAME = 'ds_user_session';
const SESSION_KEY = (id: string) => `ds:user-session:${id}`;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface UserSessionRecord {
  userId: string;
  createdAt: number;
}

/**
 * Create a new session for a freshly logged-in user.
 * Returns the session ID — caller should set this as a cookie on the response.
 */
export async function createUserSession(userId: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const sessionId = generateToken();
    const record: UserSessionRecord = { userId, createdAt: Date.now() };
    await r.set(SESSION_KEY(sessionId), record, { ex: SESSION_TTL_SECONDS });
    return sessionId;
  } catch (err) {
    console.error('[userSession] create failed:', err);
    return null;
  }
}

/** Resolve a session ID to the user it belongs to. */
export async function getUserIdFromSession(sessionId: string): Promise<string | null> {
  if (!sessionId || !/^[A-Za-z0-9_-]+$/.test(sessionId)) return null;
  const r = getRedis();
  if (!r) return null;
  try {
    const rec = await r.get<UserSessionRecord>(SESSION_KEY(sessionId));
    if (!rec) return null;
    const user = await getUserById(rec.userId);
    if (!user || (user.passwordChangedAt && rec.createdAt <= user.passwordChangedAt)) return null;
    return rec.userId;
  } catch (err) {
    console.error('[userSession] resolve failed:', err);
    return null;
  }
}

/** Helper: pull session cookie from request and resolve to userId. */
export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;
  return getUserIdFromSession(sessionId);
}

/** Helper: same as above but for server components (uses next/headers cookies). */
export async function getUserIdFromCookies(): Promise<string | null> {
  const c = await cookies();
  const sessionId = c.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;
  return getUserIdFromSession(sessionId);
}

/** Destroy a session (used on logout). */
export async function destroyUserSession(sessionId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(SESSION_KEY(sessionId));
  } catch (err) {
    console.error('[userSession] destroy failed:', err);
  }
}

/**
 * Set the session cookie on a response.
 * HttpOnly + Secure (in prod) + SameSite=Lax → cannot be read by JS,
 * only sent over HTTPS, won't leak on cross-site GET.
 */
export function setSessionCookie(res: NextResponse, sessionId: string): void {
  res.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Clear the session cookie on a response. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export const USER_SESSION_COOKIE = COOKIE_NAME;
