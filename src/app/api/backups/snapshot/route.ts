/**
 * Manual snapshot endpoint.
 * POST /api/backups/snapshot — creates a snapshot of the CURRENT live products.
 *
 * Use case: before doing a big edit / import, admin clicks "Create snapshot
 * now" so there's a guaranteed checkpoint to roll back to. Independent of
 * the monthly auto-snapshot rhythm.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/session';
import { kvGetJson, isUpstashConfigured } from '@/lib/upstash';
import { createManualSnapshot, logActivity } from '@/lib/backup';
import { getClientIp } from '@/lib/rateLimit';
import { Product } from '@/data/products';

const KV_KEY = 'ds:products';

export async function POST(req: NextRequest) {
  const username = await getRequestAdmin(req);
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isUpstashConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // Read live products and snapshot them.
  const products = (await kvGetJson<Product[]>(KV_KEY)) ?? [];

  const id = await createManualSnapshot(products);
  if (!id) {
    return NextResponse.json({ error: 'Could not create snapshot' }, { status: 502 });
  }

  logActivity({
    timestamp: Date.now(),
    action: 'snapshot',
    productCount: products.length,
    ip: getClientIp(req),
    username,
    note: 'Manual snapshot',
  }).catch(() => {});

  return NextResponse.json({ success: true, id, count: products.length }, { status: 200 });
}
