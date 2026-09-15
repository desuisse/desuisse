import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { checkAndRecord, getClientIp } from '@/lib/rateLimit';
import { kvGetJson } from '@/lib/upstash';
import { Product, resolveUnitPrice } from '@/data/products';
import { addOrder, Order, OrderItem } from '@/lib/orders';
import { sendEmail } from '@/lib/emailTemplates';

const PRODUCTS_KV_KEY = 'ds:products';

/**
 * Shipping is priced here, not by the browser. The checkout shows the same
 * two options, but the figure that lands in the order record is the server's.
 */
const SHIPPING_FEES: Record<string, number> = { standard: 0, express: 9.99 };

interface SubmittedItem {
  productId: string;
  qty: number;
  material?: string;
  size?: string;
  stone?: string;
  unitPrice?: number;
}

function parseItems(raw: unknown): SubmittedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 50).flatMap(entry => {
    if (!entry || typeof entry !== 'object') return [];
    const e = entry as Record<string, unknown>;
    const productId = typeof e.productId === 'string' ? e.productId.slice(0, 64) : '';
    const qty = Math.min(99, Math.max(1, Math.floor(Number(e.qty) || 0)));
    if (!productId || !qty) return [];
    return [{
      productId,
      qty,
      material: sanitize(e.material, 60),
      size: sanitize(e.size, 20),
      stone: sanitize(e.stone, 40),
      unitPrice: Number.isFinite(Number(e.unitPrice)) ? Number(e.unitPrice) : undefined,
    }];
  });
}

/**
 * Re-price every line from the catalogue in Upstash. The browser's numbers are
 * only ever used as a fallback when the product has since been deleted, and
 * any disagreement is recorded on the order rather than silently accepted —
 * a cart sitting open for a week is the normal cause, an edited request the
 * interesting one.
 */
async function buildItems(submitted: SubmittedItem[]): Promise<{ items: OrderItem[]; adjusted: boolean }> {
  const catalogue = (await kvGetJson<Product[]>(PRODUCTS_KV_KEY)) ?? [];
  let adjusted = false;

  const items = submitted.map(line => {
    const product = catalogue.find(p => p.id === line.productId);

    let unitPrice: number;
    if (product) {
      unitPrice = resolveUnitPrice(product, {
        variantName: line.material,
        size: line.size,
        stone: line.stone,
      });
      if (line.unitPrice !== undefined && Math.abs(line.unitPrice - unitPrice) > 0.5) adjusted = true;
    } else {
      unitPrice = Math.max(0, line.unitPrice ?? 0);
      adjusted = true;
    }

    return {
      productId: line.productId,
      name: product?.name ?? line.productId,
      image: product?.image,
      material: line.material || undefined,
      size: line.size || undefined,
      stone: line.stone || undefined,
      qty: line.qty,
      unitPrice: Math.round(unitPrice * 100) / 100,
      lineTotal: Math.round(unitPrice * line.qty * 100) / 100,
    };
  });

  return { items, adjusted };
}

function sanitize(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  // Strip HTML tags and the most dangerous quote characters.
  // We do NOT strip apostrophes (so "O'Brien" survives).
  return s.slice(0, max).replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();
}

function isValidEmail(e: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e);
}

const VALID_COUNTRIES = [
  'Kosovo','Albania','North Macedonia','Serbia','Czech Republic',
  'Germany','Switzerland','Austria','United Kingdom','United States','Other',
];

const VALID_SHIPPING = ['standard', 'express'];
const VALID_PAYMENT  = ['card', 'transfer'];

export async function POST(req: NextRequest) {
  // Reject non-JSON
  const ct = req.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  const ip = getClientIp(req);
  const limit = await checkAndRecord({ key: `order:${ip}`, max: 5, windowSeconds: 3600 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(limit.remainingMs / 1000)) },
    });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const firstName     = sanitize(b.firstName, 100);
  const lastName      = sanitize(b.lastName, 100);
  const email         = sanitize(b.email, 254).toLowerCase();
  const address       = sanitize(b.address, 200);
  const city          = sanitize(b.city, 100);
  const zip           = sanitize(b.zip, 20);
  const country       = sanitize(b.country, 60);
  const shippingMethod = sanitize(b.shippingMethod, 20);
  const paymentMethod  = sanitize(b.paymentMethod, 20);

  // Whitelist validation
  if (!firstName || !lastName)           return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (!isValidEmail(email))              return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  if (!address || !city || !zip)         return NextResponse.json({ error: 'Full address required' }, { status: 400 });
  if (!VALID_COUNTRIES.includes(country))return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  if (!VALID_SHIPPING.includes(shippingMethod)) return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
  if (!VALID_PAYMENT.includes(paymentMethod))   return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });

  // Hard block: never accept raw card data
  if (b.cardNumber || b.cvv || b.expiry) {
    return NextResponse.json(
      { error: 'Raw card data must not be submitted. Use Stripe Elements.' },
      { status: 400 }
    );
  }

  // Cryptographically secure order ID
  const orderId = `DS-${randomBytes(6).toString('hex').toUpperCase()}`;

  const { items, adjusted } = await buildItems(parseItems(b.items));
  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const subtotal    = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  const shippingFee = SHIPPING_FEES[shippingMethod] ?? 0;
  const total       = Math.round((subtotal + shippingFee) * 100) / 100;

  const order: Order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    customer: { firstName, lastName, email, phone: sanitize(b.phone, 40) || undefined },
    shipping: { address, city, zip, country, method: shippingMethod },
    paymentMethod,
    items,
    subtotal,
    shippingFee,
    total,
    ...(adjusted ? { priceAdjusted: true } : {}),
  };

  // A failed write must not read as success to the customer: they would walk
  // away believing the order exists when nothing recorded it.
  const stored = await addOrder(order);
  if (!stored) {
    console.error('[order] could not persist order', orderId);
    return NextResponse.json(
      { error: 'Order could not be saved. Please contact us directly.' },
      { status: 503 },
    );
  }

  // Notification is best-effort — the order is already safely stored, so a
  // mail outage must not fail the checkout.
  const notifyTo = process.env.CONTACT_EMAIL;
  if (notifyTo) {
    const rows = items
      .map(i => `<tr><td style="padding:6px 12px 6px 0">${i.qty}&times; ${i.name}` +
                `${i.material ? ` &middot; ${i.material}` : ''}` +
                `${i.stone ? ` &middot; ${i.stone}` : ''}` +
                `${i.size ? ` &middot; ${i.size}` : ''}` +
                `</td><td style="padding:6px 0;text-align:right">${i.lineTotal.toLocaleString('de-DE')}&euro;</td></tr>`)
      .join('');
    void sendEmail({
      to: notifyTo,
      subject: `New order ${orderId} — ${total.toLocaleString('de-DE')}€`,
      html: `<h2>New order ${orderId}</h2>
        <p>${firstName} ${lastName} &middot; ${email}</p>
        <p>${address}, ${city} ${zip}, ${country} &middot; ${shippingMethod}</p>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table>
        <p><strong>Total: ${total.toLocaleString('de-DE')}€</strong> (incl. shipping ${shippingFee.toLocaleString('de-DE')}€)</p>
        ${adjusted ? '<p style="color:#b45309">Prices were recalculated server-side — check this order before confirming.</p>' : ''}`,
    }).catch(() => {});
  }

  // TODO: integrate Stripe Payment Intent here
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const intent = await stripe.paymentIntents.create({ amount, currency: 'eur', ... });

  return NextResponse.json({ success: true, orderId }, { status: 200 });
}