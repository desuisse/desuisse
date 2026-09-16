/**
 * Site images API — admin-controlled image URLs for the homepage.
 * Same security model as /api/products.
 */
import { NextRequest, NextResponse } from 'next/server';
import { SiteImages, DEFAULT_SITE_IMAGES } from '@/lib/siteImages';
import { kvGetJson, kvSetJson, isUpstashConfigured } from '@/lib/upstash';
import { authenticateRequest } from '@/lib/session';

const KV_KEY = 'ds:site-images';

function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim().slice(0, 2048);
  if (trimmed.startsWith('/')) return trimmed;        // local public path
  if (trimmed.startsWith('https://')) return trimmed; // remote
  return '';                                           // reject everything else (incl. http:, javascript:, data:)
}

export async function GET() {
  const stored = await kvGetJson<SiteImages>(KV_KEY);
  return NextResponse.json(stored ?? DEFAULT_SITE_IMAGES, {
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
      hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars.',
    }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const images: SiteImages = {
    hero:              sanitizeImageUrl(String(b.hero || '')),
    catEveryday:       sanitizeImageUrl(String(b.catEveryday || '')),
    catEngagement:     sanitizeImageUrl(String(b.catEngagement || '')),
    catWedding:        sanitizeImageUrl(String(b.catWedding || '')),
    catEarrings:       sanitizeImageUrl(String(b.catEarrings || '')),
    catBracelets:      sanitizeImageUrl(String(b.catBracelets || '')),
    catNecklaces:      sanitizeImageUrl(String(b.catNecklaces || '')),
    catJewellery:      sanitizeImageUrl(String(b.catJewellery || '')),
    collectionClassic: sanitizeImageUrl(String(b.collectionClassic || '')),
    collectionParker:  sanitizeImageUrl(String(b.collectionParker || '')),
  };

  const ok = await kvSetJson(KV_KEY, images);
  if (!ok) {
    return NextResponse.json({
      error: 'Could not write to database. Check Vercel logs for [upstash] errors.',
    }, { status: 502 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}