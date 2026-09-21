/**
 * Input validation and sanitisation helpers.
 *
 * Philosophy: sanitise minimally and rely on safe rendering. Stripping
 * apostrophes/quotes from product names is wrong (it breaks "Women's Ring").
 * React already HTML-escapes string children, so plain text doesn't need to
 * be sanitised against XSS at save time. We DO strip `<...>` tags because
 * some fields end up in email templates that render as HTML.
 */

// ── Sanitisation ─────────────────────────────────────────────────────────

/** Strip HTML tags + JS protocol; keep apostrophes and quotes intact. */
export function sanitizeText(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  const clean = input.slice(0, 254).trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(clean) ? clean : '';
}

export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, 32).replace(/[^0-9+\-\s()]/g, '').trim();
}

/** Only allow http/https URLs (no javascript:, data:, file: etc.). */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.slice(0, 2048).trim();
  // Allow local paths under /
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return trimmed;
  } catch {
    return '';
  }
}

export function sanitizeNumber(input: unknown, min = 0, max = 999999): number {
  const n = Number(input);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/** Engraving allows the most lenient text — letters, numbers, common symbols */
export function sanitizeEngraving(input: string, maxLength = 30): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim();
}

// ── HTML escape (use before interpolating user input into HTML) ──────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Payment field validators (kept for client-side hints only) ───────────
// Note: real card data should NEVER hit our server — use Stripe Elements.

export function isValidCardNumber(input: string): boolean {
  const digits = input.replace(/\s/g, '');
  return /^\d{13,19}$/.test(digits);
}

export function isValidExpiry(input: string): boolean {
  if (!/^\d{2}\/\d{2}$/.test(input)) return false;
  const [mm, yy] = input.split('/').map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const expYear = 2000 + yy;
  return expYear > now.getFullYear() || (expYear === now.getFullYear() && mm >= now.getMonth() + 1);
}

export function isValidCVV(input: string): boolean {
  return /^\d{3,4}$/.test(input);
}

// ── Field-length limits ──────────────────────────────────────────────────

export const LIMITS = {
  NAME: 100,
  EMAIL: 254,
  PHONE: 32,   // dial code + local number, e.g. '+383 44 123 456'
  ADDRESS: 200,
  CITY: 100,
  ZIP: 20,
  COMPANY: 100,
  MESSAGE: 2000,
  PRODUCT_NAME: 200,
  DESCRIPTION: 1000,
  URL: 2048,
  ENGRAVING: 30,
  SEARCH_QUERY: 100,
  CARD_NAME: 100,
} as const;

// ── Product shape validation ─────────────────────────────────────────────

export function isValidProduct(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.category === 'string' &&
    typeof obj.image === 'string' &&
    obj.name.length <= 200 &&
    obj.price >= 0 &&
    obj.price <= 999999
  );
}