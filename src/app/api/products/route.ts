/**
 * Products API.
 *  - GET is public — returns the catalogue.
 *  - POST requires a valid server-side session (auth bypass closed).
 *  - Uses @upstash/redis library; no more double-stringify games.
 *  - Surfaces clear error messages when Upstash isn't configured.
 */
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PRODUCTS, Product } from '@/data/products';
import { kvGetJson, kvSetJson, isUpstashConfigured } from '@/lib/upstash';
import { authenticateRequest } from '@/lib/session';
import { maybeCreateMonthlySnapshot, logActivity } from '@/lib/backup';
import { getClientIp } from '@/lib/rateLimit';

const KV_KEY = 'ds:products';
const MAX_PRODUCTS = 2000;          // sanity cap on payload size
const MAX_FIELD_LEN = 4000;         // per-string field cap

function normaliseProduct(p: Product): Product {
  const result: Product = { ...p };
  if (!result.materials)        result.materials = [];
  if (!result.sizes)            result.sizes = [];
  if (!result.materialVariants) result.materialVariants = [];
  if (!result.colorVariants)    result.colorVariants = [];
  if (!result.stones)           result.stones = [];
  if (!result.stoneSizes)       result.stoneSizes = [];
  if ((result.category as string) === 'rings') result.category = 'everyday-rings';
  return result;
}

export async function GET() {
  const stored = await kvGetJson<Product[]>(KV_KEY);
  const products = (stored ?? DEFAULT_PRODUCTS).map(normaliseProduct);
  return NextResponse.json(products, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  if (!await authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isUpstashConfigured()) {
    return NextResponse.json({
      error: 'Database not configured',
      hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel → Settings → Environment Variables (Production AND Preview), then redeploy.',
    }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected array of products' }, { status: 400 });
  }

  if (body.length > MAX_PRODUCTS) {
    return NextResponse.json({ error: `Too many products (max ${MAX_PRODUCTS})` }, { status: 413 });
  }

  // Filter to valid-looking products. We're permissive about optional fields
  // but strict about the required ones and about field length.
  const products = (body as unknown[]).filter(p => {
    if (!p || typeof p !== 'object') return false;
    const o = p as Record<string, unknown>;
    return (
      typeof o.id === 'string' && o.id.length > 0 && o.id.length <= 100 &&
      typeof o.name === 'string' && o.name.length > 0 && o.name.length <= 200 &&
      typeof o.price === 'number' && o.price >= 0 && o.price <= 999999 &&
      typeof o.category === 'string' && o.category.length <= 50 &&
      typeof o.image === 'string' && o.image.length <= MAX_FIELD_LEN
    );
  }) as Product[];

  const ok = await kvSetJson(KV_KEY, products);
  if (!ok) {
    return NextResponse.json({
      error: 'Could not write to database. Check Vercel logs for [upstash] errors.',
    }, { status: 502 });
  }

  // Side effects, best-effort. Snapshot is only taken if there isn't already
  // one for the current month (so saves don't pile up snapshots) — admins
  // can take a manual snapshot any time from the admin panel before
  // big edits.
  const action = (req.headers.get('x-ds-action') as 'save' | 'restore' | 'import' | 'reset') || 'save';
  maybeCreateMonthlySnapshot(products).catch(err => console.error('[products] snapshot failed:', err));
  logActivity({
    timestamp: Date.now(),
    action,
    productCount: products.length,
    ip: getClientIp(req),
  }).catch(err => console.error('[products] logActivity failed:', err));

  return NextResponse.json({ success: true, count: products.length }, { status: 200 });
}
