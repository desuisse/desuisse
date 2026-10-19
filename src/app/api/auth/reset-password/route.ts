/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 *
 * Validates the token (single-use, time-limited), hashes the new password,
 * saves the user. Does NOT auto-login — customer must explicitly sign in
 * with the new password (gives a clear "your password was reset" signal).
 */
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, validatePassword } from '@/lib/auth';
import { consumeResetToken, getUserById, saveUser } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  let body: { token?: string; newPassword?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { token, newPassword } = body;
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  }

  const pwCheck = validatePassword(newPassword ?? '');
  if (!pwCheck.valid) {
    return NextResponse.json({ error: pwCheck.reason }, { status: 400 });
  }

  const userId = await consumeResetToken(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  }

  user.passwordHash = await hashPassword(newPassword!);
  user.passwordChangedAt = Date.now();
  const saved = await saveUser(user);
  if (!saved) {
    return NextResponse.json({ error: 'Could not update password' }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
