/**
 * Restore a snapshot to live products.
 * POST /api/backups/restore  body: { id: "2026-05-30T12-34-56" }
 *
 * After restoring, a NEW snapshot of the now-live state is also created
 * (so you could un-restore by picking the snapshot from just before this).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/session';
import { kvSetJson, isUpstashConfigured } from '@/lib/upstash';
import { loadSnapshot, createManualSnapshot, logActivity } from '@/lib/backup';
import { getClientIp } from '@/lib/rateLimit';

const KV_KEY = 'ds:products';

export async function POST(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  const username = await getRequestAdmin(req);
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isUpstashConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { id } = body as { id?: unknown };
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid snapshot ID' }, { status: 400 });
  }

  const products = await loadSnapshot(id);
  if (!products) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  const ok = await kvSetJson(KV_KEY, products.map(product => ({ ...product, publishedBy: product.publishedBy || 'Lorik' })));
  if (!ok) {
    return NextResponse.json({ error: 'Failed to restore' }, { status: 502 });
  }

  // Best-effort: create a MANUAL snapshot reflecting the now-restored state
  // (admin explicitly triggered this, so a checkpoint is warranted regardless
  // of monthly cadence), and log the restore action so it's traceable.
  createManualSnapshot(products).catch(err => console.error('[restore] snapshot failed:', err));
  logActivity({
    timestamp: Date.now(),
    action: 'restore',
    productCount: products.length,
    ip: getClientIp(req),
    username,
    note: `Restored from snapshot ${id}`,
  }).catch(err => console.error('[restore] log failed:', err));

  return NextResponse.json({ success: true, count: products.length }, { status: 200 });
}
