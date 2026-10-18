/**
 * Server-side session storage for the admin panel.
 *
 * SECURITY FIX: previously, `isAuthenticated()` only checked that the
 * cookie value was 64 characters long. Anyone could open devtools, set
 *   document.cookie = "ds_admin_session=" + "a".repeat(64);
 * and then POST to /api/products to deface the catalogue.
 *
 * Now: on login we generate a random 64-hex-char token AND store it in
 * Upstash with a 2-hour TTL. Validation reads the token from Upstash and
 * confirms it exists; forged tokens fail.
 */
import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { getRedis, kvDel } from './upstash';

const SESSION_KEY_PREFIX = 'ds:session:';
const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours
export const SESSION_COOKIE_NAME = 'ds_admin_session';

/** Generate a new session token and persist it server-side. */
export async function createSession(username = 'Lorik'): Promise<string | null> {
  const r = getRedis();
  if (!r) {
    console.error('[session] Cannot create session — Upstash not configured');
    return null;
  }
  const token = randomBytes(32).toString('hex'); // 64 hex chars
  try {
    await r.set(`${SESSION_KEY_PREFIX}${token}`, username, { ex: SESSION_TTL_SECONDS });
    return token;
  } catch (err) {
    console.error('[session] Failed to persist session:', err);
    return null;
  }
}

/** Validate a session token by checking it exists in Upstash. */
export async function getSessionUser(token: string | undefined): Promise<string | null> {
  if (!token || typeof token !== 'string') return null;
  if (token.length !== 64 || !/^[a-f0-9]+$/.test(token)) return null;
  const r = getRedis();
  if (!r) return null;
  try {
    const val = await r.get<string | number>(`${SESSION_KEY_PREFIX}${token}`);
    if (!val) return null;
    // Sessions issued before named accounts stored "1". They belong to the
    // original password holder, Lorik.
    if (val === '1' || val === 1) return 'Lorik';
    if (val === 'Lorik') return val;
    if (typeof val !== 'string') return null;
    // Removing an account also invalidates its existing sessions.
    return await r.exists(`ds:admin:user:${val.toLowerCase()}`) ? val : null;
  } catch (err) {
    console.error('[session] Validation error:', err);
    return null;
  }
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  return (await getSessionUser(token)) !== null;
}

export async function getRequestAdmin(req: NextRequest): Promise<string | null> {
  return getSessionUser(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

/** Helper for API routes — extracts and validates the session cookie. */
export async function authenticateRequest(req: NextRequest): Promise<boolean> {
  return (await getRequestAdmin(req)) !== null;
}

/** Destroy a session (logout). */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await kvDel(`${SESSION_KEY_PREFIX}${token}`);
}
