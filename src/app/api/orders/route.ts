/**
 * Orders API — admin only.
 *
 * GET   /api/orders          list every stored order, newest first
 * PATCH /api/orders          { id, status } change one order's status
 *
 * Same security model as /api/products: a server-side session cookie, not a
 * shared secret the browser can forge.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import { isUpstashConfigured } from '@/lib/upstash';
import { getOrders, updateOrderStatus, isOrderStatus } from '@/lib/orders';

export async function GET(req: NextRequest) {
  if (!await authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await getOrders();
  return NextResponse.json(orders, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PATCH(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  if (!await authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isUpstashConfigured()) {
    return NextResponse.json({
      error: 'Database not configured',
      hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars.',
    }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const b = (body ?? {}) as Record<string, unknown>;
  const id = typeof b.id === 'string' ? b.id.slice(0, 64) : '';
  const status = b.status;

  if (!id) return NextResponse.json({ error: 'Order id required' }, { status: 400 });
  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
  }

  const updated = await updateOrderStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: 'Order not found or could not be saved' }, { status: 404 });
  }

  return NextResponse.json(updated, { status: 200 });
}
