/**
 * Price formulas used by the admin's "Apply formula" button.
 *  - GET is public (they are not secret, and the payload is tiny).
 *  - POST requires a valid admin session, exactly like /api/products.
 *
 * The storefront never reads these: formulas are applied when the admin
 * presses the button, and the resulting numbers are stored on the product.
 */
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PRICING_RULES, PricingRules, CategoryPricingRule } from '@/data/pricingRules';
import { kvGetJson, kvSetJson, isUpstashConfigured } from '@/lib/upstash';
import { authenticateRequest } from '@/lib/session';

const KV_KEY = 'ds:pricing-rules';

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Never trust the payload: a divisor of 0 or a wild offset would poison prices. */
function sanitiseRules(input: unknown): PricingRules {
  if (!input || typeof input !== 'object') return {};
  const out: PricingRules = {};

  for (const [category, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const carats: CategoryPricingRule['carats'] = {};

    if (r.carats && typeof r.carats === 'object') {
      for (const [carat, rule] of Object.entries(r.carats as Record<string, unknown>)) {
        if (!rule || typeof rule !== 'object') continue;
        const cr = rule as Record<string, unknown>;
        carats[carat.slice(0, 12)] = {
          divisor: clampNumber(cr.divisor, 0.01, 100, 1),
          offset: clampNumber(cr.offset, -100000, 100000, 0),
        };
      }
    }

    out[category as keyof PricingRules] = { enabled: Boolean(r.enabled), carats };
  }
  return out;
}

export async function GET() {
  const stored = await kvGetJson<PricingRules>(KV_KEY);
  return NextResponse.json(stored ?? DEFAULT_PRICING_RULES, {
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
      hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel, then redeploy.',
    }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const rules = sanitiseRules(body);
  const ok = await kvSetJson(KV_KEY, rules);
  if (!ok) return NextResponse.json({ error: 'Could not save' }, { status: 500 });

  return NextResponse.json({ success: true, rules }, { status: 200 });
}
