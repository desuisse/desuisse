import { NextRequest, NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/session';
import { createAdminUser, deleteAdminUser, listAdminUsers, normaliseAdminName } from '@/lib/adminUsers';

async function requireOwner(req: NextRequest) {
  return (await getRequestAdmin(req)) === 'Lorik';
}

export async function GET(req: NextRequest) {
  if (!await requireOwner(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    return NextResponse.json(await listAdminUsers(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load admin users' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!await requireOwner(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }
  const body = await req.json().catch(() => null) as { name?: unknown; password?: unknown } | null;
  const name = typeof body?.name === 'string' ? normaliseAdminName(body.name) : null;
  const password = body?.password;
  if (!name || name.toLowerCase() === 'lorik' || typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: 'Use a unique name and a password of at least 12 characters' }, { status: 400 });
  }
  const result = await createAdminUser(name, password);
  if (result === 'exists') return NextResponse.json({ error: 'That admin name already exists' }, { status: 409 });
  if (result === 'error') return NextResponse.json({ error: 'Could not create admin user' }, { status: 502 });
  return NextResponse.json({ name }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!await requireOwner(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }
  const body = await req.json().catch(() => null) as { name?: unknown } | null;
  const name = typeof body?.name === 'string' ? normaliseAdminName(body.name) : null;
  if (!name || name.toLowerCase() === 'lorik') return NextResponse.json({ error: 'Invalid admin name' }, { status: 400 });
  if (!await deleteAdminUser(name)) return NextResponse.json({ error: 'Could not remove admin user' }, { status: 502 });
  return NextResponse.json({ success: true });
}
