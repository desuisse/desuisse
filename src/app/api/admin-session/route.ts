/**
 * Lightweight session-check endpoint.
 * Returns 200 if the request carries a valid session cookie, 401 otherwise.
 * Used by the admin page to decide whether to show the login form or the
 * admin UI on initial load.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  const username = await getRequestAdmin(req);
  if (!username) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, username }, { status: 200 });
}
