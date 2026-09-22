/**
 * Per-category price formulas.
 *
 * Wedding rings are quoted as a PAIR on the storefront (hasCoupleOption makes
 * formatPrice multiply by two bands), while the material prices stored on the
 * product are PER BAND. So a pair quoted 900–1.100€ is 450–550€ a band —
 * hence the divisor of 2. The 18ct line then carries a flat surcharge over
 * 14ct.
 *
 * These formulas are a TYPING AID, not a live pricing engine. The admin
 * presses "Apply formula", the numbers land in the Min/Max boxes, and from
 * that moment they are ordinary stored prices that can be hand-edited.
 * Nothing on the storefront reads this file — so editing a formula never
 * silently repnces products that are already published.
 */
import type { Category } from './products';

export interface CaratRule {
  /** Base price is divided by this. 2 = per band on a pair-quoted ring. */
  divisor: number;
  /** Flat euros added after the division. */
  offset: number;
}

export interface CategoryPricingRule {
  enabled: boolean;
  /** Keyed by carat exactly as it appears in CARATS ('14ct', '18ct'). */
  carats: Record<string, CaratRule>;
}

export type PricingRules = Partial<Record<Category, CategoryPricingRule>>;

/**
 * What a fresh install starts with: wedding rings only, matching how the
 * boutique already quotes them. Other categories can be switched on from the
 * admin's Pricing tab without touching this file.
 */
export const DEFAULT_PRICING_RULES: PricingRules = {
  'wedding-rings': {
    enabled: true,
    carats: {
      '14ct': { divisor: 2, offset: 0 },
      '18ct': { divisor: 2, offset: 100 },
    },
  },
};

/** One variant's price, to the nearest whole euro, never below zero. */
export function applyCaratRule(base: number, rule: CaratRule): number {
  const divisor = rule.divisor === 0 ? 1 : rule.divisor;
  return Math.max(0, Math.round(base / divisor + rule.offset));
}

export function ruleForCategory(rules: PricingRules, category: Category): CategoryPricingRule | null {
  const rule = rules[category];
  return rule && rule.enabled ? rule : null;
}

/** '÷2 +100€' — the formula in one glance, for the admin UI. */
export function describeRule(rule: CaratRule): string {
  const parts = [`÷${rule.divisor}`];
  if (rule.offset > 0) parts.push(`+${rule.offset}€`);
  if (rule.offset < 0) parts.push(`−${Math.abs(rule.offset)}€`);
  return parts.join(' ');
}
