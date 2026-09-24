/**
 * Product types + client-side helpers.
 *
 * Important: products live ONLY in Upstash. There is no localStorage cache —
 * that was masking failures (admin would see their changes locally and
 * assume save worked, while other devices saw nothing). If a save fails,
 * the admin UI MUST surface the error so the operator knows to fix env
 * vars instead of silently being out of sync.
 */
export interface MaterialVariant {
  name: string;
  price: number;     // minimum / base price (or the exact price, if priceMax is not set)
  priceMax?: number; // maximum price — set this when the exact weight/price is only known once made
  /** Optional product photo for this metal. A Yellow Gold photo, for example,
   * is shown as soon as a shopper chooses any Yellow Gold carat. */
  image?: string;
}

/** A named visual treatment, for collections offered in several gemstone or
 * enamel colours. Each colour may carry an unlimited product gallery. */
export interface ColorVariant {
  name: string;
  images: string[];
}

/**
 * Band width in millimetres.
 *
 * Only the widths a ring is actually made in get ticked in the admin, so a
 * model offered in three widths shows three buttons and one offered in none
 * shows no width row at all. Each width carries its own photo, because a
 * 2mm band and an 8mm band are visibly different objects, and its own
 * surcharge, because the wide one uses far more metal.
 */
export interface WidthVariant {
  /** '4mm' — one of WIDTH_OPTIONS. */
  mm: string;
  /**
   * Photo per metal for this width, keyed by the METAL ONLY — 'Yellow Gold',
   * not 'Yellow Gold 14ct'. A 6mm band in yellow and in white gold are two
   * different photographs; the carat is not visible in a picture, so 14ct and
   * 18ct of the same metal share one.
   */
  images?: Record<string, string>;
  /** Fallback photo for this width when a metal has none of its own. */
  image?: string;
  /** Euros ADDED to the material price. 0 or absent = no surcharge. */
  surcharge?: number;
}

export const WIDTH_OPTIONS = Array.from({ length: 10 }, (_, i) => `${i + 1}mm`);

export type Category =
  | 'everyday-rings'
  | 'exclusive-models'
  | 'engagement-rings'
  | 'wedding-rings'
  | 'eternity-rings'
  | 'earrings'
  | 'bracelets'
  | 'necklaces';

export interface Product {
  id: string;
  name: string;
  price: number;
  priceMax?: number;
  category: Category;
  description: string;       // English
  descriptionSq?: string;    // Albanian
  image: string;
  image2?: string;
  featured: boolean;
  materials: string[];
  materialVariants: MaterialVariant[];
  colorVariants?: ColorVariant[];
  /** Band widths this model is made in. Absent/empty = no width choice. */
  widthVariants?: WidthVariant[];
  sizes: string[];
  sku?: string;
  stones?: string[];
  stoneSizes?: string[];
  hasCoupleOption?: boolean;
  hasEngraving?: boolean;
  /**
   * Per-stone surcharge in euros, ADDED to the material variant's price.
   * Keyed by the stone name exactly as it appears in STONE_OPTIONS, e.g.
   *   { 'Moissanite': 0, 'Lab Diamond': 400, 'Diamond': 1800 }
   * A surcharge composes with the material/carat price and the ring-size
   * interpolation, so a product with five metals still needs three numbers
   * rather than fifteen.
   */
  stoneSurcharges?: Record<string, number>;
}

export const MATERIAL_OPTIONS = ['Yellow Gold','White Gold','Rose Gold','Silver','Platinum'];
export const CARATS = ['14ct', '18ct'];

/**
 * Albanian names for the metals.
 *
 * DISPLAY ONLY. The stored variant names stay English ('Yellow Gold 14ct')
 * because they are the key everything else matches on — the cart line, the
 * order record, the material photo, the admin. Translating the stored value
 * would silently orphan every existing product and order.
 */
const MATERIAL_SQ: Record<string, string> = {
  'Yellow Gold': 'Ari i Verdhë',
  'White Gold': 'Ari i Bardhë',
  'Rose Gold': 'Ari Rozë',
  'Silver': 'Argjend',
  'Platinum': 'Platin',
};

/**
 * 'Yellow Gold 14ct' → 'Ari i Verdhë 14ct' in Albanian, unchanged in English.
 * The carat is kept as-is: '14ct' reads the same in both languages.
 */
export function materialLabel(name: string, language: string): string {
  if (language !== 'sq' || !name) return name;
  const carat = name.match(/\s(14ct|18ct)$/)?.[1];
  const metal = carat ? name.slice(0, -(carat.length + 1)) : name;
  const translated = MATERIAL_SQ[metal];
  if (!translated) return name;
  return carat ? `${translated} ${carat}` : translated;
}
export const STONE_OPTIONS = ['Diamond', 'Lab Diamond', 'Moissanite', 'No Stone'];
export const STONE_SIZE_OPTIONS = ['0.20ct','0.30ct','0.50ct','0.75ct','1.00ct','1.50ct','2.00ct','3.75mm','4.00mm','4.50mm','5.00mm'];
export const RING_SIZES = Array.from({ length: 75 - 45 + 1 }, (_, i) => String(45 + i)); // '45'..'75'
export const BRACELET_SIZES = ['16cm','17cm','18cm','19cm','20cm'];
export const NECKLACE_SIZES = ['40cm','45cm','50cm','55cm','60cm'];
export const ENGRAVING_SYMBOLS = ['♡','♥','∞','✦','✶','☆','★','◆','✿','☾'];

export const CATEGORIES: { key: Category; en: string; sq: string }[] = [
  { key: 'everyday-rings',   en: 'Everyday Rings',   sq: 'Unaza të Përditshme' },
  { key: 'exclusive-models', en: 'Exclusive Models',  sq: 'Modele Ekskluzive' },
  { key: 'engagement-rings', en: 'Engagement Rings', sq: 'Unaza Fejese' },
  { key: 'wedding-rings',    en: 'Wedding Rings',    sq: 'Unaza Martese' },
  { key: 'eternity-rings',   en: 'Eternity Rings',   sq: 'Unaza Eternity' },
  { key: 'earrings',         en: 'Earrings',         sq: 'Vathë' },
  { key: 'bracelets',        en: 'Bracelets',        sq: 'Byzylykë' },
  { key: 'necklaces',        en: 'Necklaces',        sq: 'Qafore' },
];

export const DEFAULT_PRODUCTS: Product[] = [];

// ── Fetch from API (the only source of truth, shared across all devices) ──
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[fetchProducts] error:', err);
    return [];
  }
}

/**
 * Save products via the API. Returns a result object so callers can show
 * a precise error to the admin (e.g. "Upstash env vars missing").
 */
export interface SaveResult {
  ok: boolean;
  status: number;
  error?: string;
  hint?: string;
}

export async function saveProductsToDb(products: Product[]): Promise<SaveResult> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(products),
    });
    if (res.ok) return { ok: true, status: res.status };
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      status: res.status,
      error: body.error || `HTTP ${res.status}`,
      hint: body.hint,
    };
  } catch (err) {
    return { ok: false, status: 0, error: 'Network error: ' + String(err) };
  }
}

// The material + carat combination shown by default everywhere a product is
// listed (shop grid, quick view, product page) before the customer picks
// something else. Custom pieces are quoted across many materials/carats —
// showing the full silver-to-platinum spread by default was confusing, so
// we anchor on one sensible default instead.
export const DEFAULT_VARIANT_NAME = 'Yellow Gold 14ct';

/**
 * Picks the variant to show by default: exact "Yellow Gold 14ct" match first,
 * then any Yellow Gold carat, then just the first variant the admin added.
 */
export function getDefaultVariant(product: Product): MaterialVariant | null {
  if (!product.materialVariants || product.materialVariants.length === 0) return null;
  return (
    product.materialVariants.find(v => v.name === DEFAULT_VARIANT_NAME) ||
    product.materialVariants.find(v => v.name.startsWith('Yellow Gold')) ||
    product.materialVariants[0]
  );
}

/** Formats a single variant's price as an exact figure or a min–max range. */
export function formatVariantPrice(variant: MaterialVariant): string {
  const { price, priceMax } = variant;
  if (priceMax && priceMax > price) {
    return `${price.toLocaleString('de-DE')}.00€ – ${priceMax.toLocaleString('de-DE')}.00€`;
  }
  return `${price.toLocaleString('de-DE')}.00€`;
}

const euro = (n: number) => `${Math.round(n).toLocaleString('de-DE')}.00€`;

/**
 * The price range a product is actually sold at — the numbers behind the
 * figure on the card. Filtering and sorting MUST use this rather than the
 * raw `price` field, or the shop quietly filters on one number while
 * showing the customer a different one.
 *
 * The one figure shown wherever a product is listed.
 *
 * Material prices are per band. A couple piece is bought as a pair, so its
 * headline is two bands — otherwise a set priced 350–550 per ring advertises
 * itself at half what the customer actually pays.
 *
 * The product's own price/priceMax fields are only a fallback for products
 * that have no materials configured; anything with materials is quoted from
 * them, so the catalogue can never disagree with the product page.
 */
export function getPriceRange(product: Product): { min: number; max: number } {
  const bands = product.hasCoupleOption ? 2 : 1;
  const defaultVariant = getDefaultVariant(product);

  if (defaultVariant) {
    const min = defaultVariant.price * bands;
    const max = (defaultVariant.priceMax && defaultVariant.priceMax > defaultVariant.price
      ? defaultVariant.priceMax
      : defaultVariant.price) * bands;
    return { min, max };
  }

  const max = product.priceMax && product.priceMax > product.price ? product.priceMax : product.price;
  return { min: product.price, max };
}

export function formatPrice(product: Product): string {
  const { min, max } = getPriceRange(product);
  return max > min ? `${euro(min)} – ${euro(max)}` : euro(min);
}

export const RING_CATEGORIES: Category[] = ['everyday-rings', 'exclusive-models', 'engagement-rings', 'wedding-rings', 'eternity-rings'];
export function isRingCategory(category: Category): boolean {
  return RING_CATEGORIES.includes(category);
}

// Ring sizes are sold as a continuous 45–75 slider (EU sizing), not a fixed
// checklist. Since a size-75 ring uses meaningfully more metal than a
// size-45 one, the material's Min price is treated as the price at size 45
// and Max as the price at size 75, stepping up every 3 sizes in between
// (so the number doesn't jitter on every single click of the slider).
export const RING_SIZE_MIN = 45;
export const RING_SIZE_MAX = 75;
export const RING_SIZE_PRICE_STEP = 3;

export function priceForRingSize(variant: MaterialVariant, size: number): number {
  const min = variant.price;
  const max = variant.priceMax && variant.priceMax > min ? variant.priceMax : min;
  if (max === min) return min;

  const span = RING_SIZE_MAX - RING_SIZE_MIN; // 30
  const tierCount = Math.floor(span / RING_SIZE_PRICE_STEP); // 10 steps of 3
  const clamped = Math.min(RING_SIZE_MAX, Math.max(RING_SIZE_MIN, size));
  const tier = Math.min(tierCount, Math.floor((clamped - RING_SIZE_MIN) / RING_SIZE_PRICE_STEP));

  return Math.round(min + (max - min) * (tier / tierCount));
}

export function formatRingSizePrice(variant: MaterialVariant, size: number): string {
  return `${priceForRingSize(variant, size).toLocaleString('de-DE')}.00€`;
}

// ── Stone pricing ─────────────────────────────────────────────
// The stone is priced as a surcharge rather than an absolute figure so it
// stacks on top of whatever metal, carat and ring size the customer picked.
// Anything missing or malformed reads as zero: a broken surcharge must never
// silently *lower* a price.
export function getStoneSurcharge(
  product: Pick<Product, 'stoneSurcharges'> | null | undefined,
  stone: string | undefined | null,
): number {
  if (!product || !stone || !product.stoneSurcharges) return 0;
  const value = product.stoneSurcharges[stone];
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

/**
 * Stones quoted individually instead of carried at a listed price.
 *
 * Natural diamonds move with the market and the stock actually in the safe,
 * so publishing a number means either quoting high enough to lose the sale or
 * low enough to lose money. These are offered as an enquiry: the option is
 * still shown — the customer must be able to see that the ring CAN be made
 * with a diamond — but it links to the contact form rather than a price.
 */
export const ENQUIRY_STONES = ['Diamond'];

export function isEnquiryStone(stone: string | null | undefined): boolean {
  return Boolean(stone) && ENQUIRY_STONES.includes(stone as string);
}

/** Contact-form link carrying what the customer was looking at. */
export function enquiryHref(productName: string, stone: string): string {
  return `/contact?about=${encodeURIComponent(`${productName} — ${stone}`)}`;
}

/**
 * The photo for a width in a given metal, most specific first:
 * this width in this metal → this width's fallback → nothing (the caller
 * then falls back to the colour gallery, the material photo, the main image).
 *
 * `variantName` may carry a carat ('Rose Gold 18ct'); only the metal is used.
 */
export function widthImageFor(
  product: Pick<Product, 'widthVariants'> | null | undefined,
  mm: string | undefined | null,
  variantName?: string | null,
): string {
  if (!product || !mm || !product.widthVariants) return '';
  const w = product.widthVariants.find(v => v.mm === mm);
  if (!w) return '';
  const metal = (variantName || '').replace(/\s+(14|18)ct$/, '').trim();
  return (metal && w.images?.[metal]) || w.image || '';
}

export function getWidthSurcharge(
  product: Pick<Product, 'widthVariants'> | null | undefined,
  mm: string | undefined | null,
): number {
  if (!product || !mm || !product.widthVariants) return 0;
  const found = product.widthVariants.find(w => w.mm === mm);
  const value = found?.surcharge;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

/** '+1.800€' for a positive surcharge, empty string for none. */
export function formatStoneSurcharge(amount: number): string {
  return amount > 0 ? `+${amount.toLocaleString('de-DE')}€` : '';
}

/**
 * THE price function. Product page, cart and the order API all call this, so
 * a customer cannot end up with one number on screen and another in the
 * order record — the bug class that makes a shop quietly lose money.
 */
export function resolveUnitPrice(
  product: Product,
  opts: { variantName?: string; size?: string | number; stone?: string; width?: string },
): number {
  const variant =
    (product.materialVariants || []).find(v => v.name === opts.variantName) ||
    getDefaultVariant(product);

  const sizeNum = Number(opts.size);
  const hasSize = Number.isFinite(sizeNum) && sizeNum > 0;

  let base: number;
  if (variant) {
    base = isRingCategory(product.category) && hasSize
      ? priceForRingSize(variant, sizeNum)
      : variant.price;
  } else {
    base = product.price || 0;
  }

  // Width is a surcharge like the stone. It MUST be here: this is what the
  // order API recomputes with, so leaving it out would both undercharge the
  // order and flag every width purchase as a price mismatch.
  return base + getStoneSurcharge(product, opts.stone) + getWidthSurcharge(product, opts.width);
}
