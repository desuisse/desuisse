import bcrypt from 'bcryptjs';
import { getRedis } from './upstash';

const USER_PREFIX = 'ds:admin:user:';
const USER_INDEX = 'ds:admin:users';

export interface AdminUser {
  name: string;
  passwordHash: string;
  createdAt: number;
}

export function normaliseAdminName(value: string): string | null {
  const name = value.trim();
  return /^[A-Za-z][A-Za-z0-9_-]{1,31}$/.test(name) ? name : null;
}

export async function verifyAdminUser(name: string, password: string): Promise<string | null> {
  const clean = normaliseAdminName(name);
  const r = getRedis();
  if (!clean || !r) return null;
  try {
    const user = await r.get<AdminUser>(`${USER_PREFIX}${clean.toLowerCase()}`);
    if (!user) return null;
    return await bcrypt.compare(password, user.passwordHash) ? user.name : null;
  } catch (err) {
    console.error('[admin-users] Verification failed:', err);
    return null;
  }
}

export async function listAdminUsers(): Promise<{ name: string; createdAt: number }[]> {
  const r = getRedis();
  if (!r) throw new Error('Database unavailable');
  const names = await r.smembers<string[]>(USER_INDEX);
  const users = await Promise.all(names.map(name => r.get<AdminUser>(`${USER_PREFIX}${name}`)));
  return [
    { name: 'Lorik', createdAt: 0 },
    ...users.filter((user): user is AdminUser => Boolean(user)).map(({ name, createdAt }) => ({ name, createdAt })),
  ];
}

export async function createAdminUser(name: string, password: string): Promise<'created' | 'exists' | 'error'> {
  const r = getRedis();
  if (!r) return 'error';
  const key = `${USER_PREFIX}${name.toLowerCase()}`;
  try {
    const user: AdminUser = { name, passwordHash: await bcrypt.hash(password, 12), createdAt: Date.now() };
    const result = await r.set(key, user, { nx: true });
    if (result !== 'OK') return 'exists';
    await r.sadd(USER_INDEX, name.toLowerCase());
    return 'created';
  } catch (err) {
    console.error('[admin-users] Create failed:', err);
    return 'error';
  }
}

export async function deleteAdminUser(name: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const key = name.toLowerCase();
  try {
    await r.del(`${USER_PREFIX}${key}`);
    await r.srem(USER_INDEX, key);
    return true;
  } catch (err) {
    console.error('[admin-users] Delete failed:', err);
    return false;
  }
}
