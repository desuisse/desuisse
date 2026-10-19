/**
 * User store — single source of truth for user records in Upstash.
 *
 * Keys:
 *   ds:user:{userId}              → User record (JSON)
 *   ds:user:by-email:{email}      → userId (lookup index for login)
 *   ds:verify-token:{token}       → { userId, expiresAt } (24-hour TTL)
 *   ds:reset-token:{token}        → { userId, expiresAt } (1-hour TTL)
 *
 * SECURITY:
 *   - Passwords are bcrypt-hashed before this layer ever sees them.
 *   - Email lookups are normalized (lowercase + trim) at every entry point.
 *   - findByEmail intentionally returns null for non-existent users
 *     (callers must handle "user not found" themselves — no info leak).
 *   - Account creation is atomic: we check email uniqueness via a
 *     conditional set on the email→id index.
 */
import { getRedis } from './upstash';
import { normalizeEmail, generateToken } from './auth';

const USER_KEY = (id: string) => `ds:user:${id}`;
const EMAIL_KEY = (email: string) => `ds:user:by-email:${email}`;
const VERIFY_KEY = (token: string) => `ds:verify-token:${token}`;
const RESET_KEY = (token: string) => `ds:reset-token:${token}`;

const VERIFY_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const RESET_TTL_SECONDS = 60 * 60;       // 1 hour

export interface User {
  id: string;
  email: string;          // normalized (lowercase, trimmed)
  name: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: number;
  passwordChangedAt?: number; // sessions created before this time are invalid
  wishlist: string[];     // array of product IDs
}

export interface TokenRecord {
  userId: string;
  expiresAt: number;
}

/** Generate a new unique user ID. */
function newUserId(): string {
  // 12 bytes of randomness → ~16 base64url chars. Short, unguessable.
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'u_' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Look up a user by ID. Returns null if not found or Upstash unavailable. */
export async function getUserById(userId: string): Promise<User | null> {
  if (!userId || typeof userId !== 'string') return null;
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get<User>(USER_KEY(userId));
  } catch (err) {
    console.error('[userStore] getUserById failed:', err);
    return null;
  }
}

/** Look up a user by email. Returns null if not found. */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const r = getRedis();
  if (!r) return null;
  try {
    const userId = await r.get<string>(EMAIL_KEY(normalized));
    if (!userId) return null;
    return await getUserById(userId);
  } catch (err) {
    console.error('[userStore] getUserByEmail failed:', err);
    return null;
  }
}

/**
 * Atomically create a new user account.
 * Returns the new user record, or null if the email is already taken
 * or Upstash is unavailable.
 */
export async function createUser(args: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User | null> {
  const r = getRedis();
  if (!r) return null;

  const email = normalizeEmail(args.email);
  if (!email) return null;

  try {
    // Reserve the email atomically with NX (only set if not exists).
    // If another process already claimed this email, this returns null.
    const userId = newUserId();
    const reserved = await r.set(EMAIL_KEY(email), userId, { nx: true });
    if (reserved !== 'OK') {
      // Email already taken
      return null;
    }

    const user: User = {
      id: userId,
      email,
      name: args.name.trim().slice(0, 100),
      passwordHash: args.passwordHash,
      emailVerified: false,
      createdAt: Date.now(),
      wishlist: [],
    };
    await r.set(USER_KEY(userId), user);
    return user;
  } catch (err) {
    console.error('[userStore] createUser failed:', err);
    return null;
  }
}

/** Update a user record in place. Caller passes the full updated User. */
export async function saveUser(user: User): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    await r.set(USER_KEY(user.id), user);
    return true;
  } catch (err) {
    console.error('[userStore] saveUser failed:', err);
    return false;
  }
}

/** Delete a user and all their references (for GDPR right-to-be-forgotten). */
export async function deleteUser(userId: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const user = await getUserById(userId);
    if (!user) return true; // already gone
    await Promise.all([
      r.del(USER_KEY(userId)),
      r.del(EMAIL_KEY(user.email)),
    ]);
    return true;
  } catch (err) {
    console.error('[userStore] deleteUser failed:', err);
    return false;
  }
}

// ─── EMAIL VERIFICATION TOKENS ─────────────────────────────────────────

/** Create a verification token tied to a user. Returns the token string. */
export async function createVerificationToken(userId: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const token = generateToken();
    const expiresAt = Date.now() + VERIFY_TTL_SECONDS * 1000;
    await r.set(VERIFY_KEY(token), { userId, expiresAt } as TokenRecord, {
      ex: VERIFY_TTL_SECONDS,
    });
    return token;
  } catch (err) {
    console.error('[userStore] createVerificationToken failed:', err);
    return null;
  }
}

/**
 * Consume a verification token: returns the userId if valid, else null.
 * Deletes the token on use (single-use).
 */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }
  const r = getRedis();
  if (!r) return null;
  try {
    const rec = await r.getdel<TokenRecord>(VERIFY_KEY(token));
    if (!rec || rec.expiresAt < Date.now()) return null;
    return rec.userId;
  } catch (err) {
    console.error('[userStore] consumeVerificationToken failed:', err);
    return null;
  }
}

// ─── PASSWORD RESET TOKENS ─────────────────────────────────────────────

/** Create a password reset token. Returns the token string. */
export async function createResetToken(userId: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const token = generateToken();
    const expiresAt = Date.now() + RESET_TTL_SECONDS * 1000;
    await r.set(RESET_KEY(token), { userId, expiresAt } as TokenRecord, {
      ex: RESET_TTL_SECONDS,
    });
    return token;
  } catch (err) {
    console.error('[userStore] createResetToken failed:', err);
    return null;
  }
}

/** Consume a reset token: returns userId if valid, else null. Single-use. */
export async function consumeResetToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }
  const r = getRedis();
  if (!r) return null;
  try {
    const rec = await r.getdel<TokenRecord>(RESET_KEY(token));
    if (!rec || rec.expiresAt < Date.now()) return null;
    return rec.userId;
  } catch (err) {
    console.error('[userStore] consumeResetToken failed:', err);
    return null;
  }
}
