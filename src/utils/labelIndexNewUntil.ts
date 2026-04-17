import type {
  Label,
  ConditionRule,
  WeightUnit,
} from "../extensions/dashboard/pages/types";
import {
  clampNewStatusDaysOld,
  productMatchesDiscountRule,
  productMatchesInventoryStatusRule,
} from "../store/conditionRulesShared";
import { productWeightInRuleUnit } from "./weightUnits";
import type { NormalizedProduct } from "../store/types";

type FilterRule = Extract<
  ConditionRule,
  {
    type:
      | "priceRange"
      | "weightRange"
      | "discount"
      | "inventoryStatus"
      | "inventoryQuantity"
      | "newStatus";
  }
>;

function splitRules(rules: ConditionRule[]): { filters: FilterRule[] } {
  const filters = rules.filter(
    (rule): rule is FilterRule =>
      rule.type === "priceRange" ||
      rule.type === "weightRange" ||
      rule.type === "discount" ||
      rule.type === "inventoryStatus" ||
      rule.type === "inventoryQuantity" ||
      rule.type === "newStatus"
  );
  return { filters };
}

function isWithinRange(
  value: number | null,
  min?: number,
  max?: number
): boolean {
  if (value == null) return false;
  if (typeof min === "number" && value < min) return false;
  if (typeof max === "number" && value > max) return false;
  return true;
}

function matchesFilterRule(
  product: NormalizedProduct,
  rule: FilterRule,
  now: number
): boolean {
  if (rule.type === "priceRange") {
    return isWithinRange(product.price, rule.min, rule.max);
  }
  if (rule.type === "weightRange") {
    const ru: WeightUnit = rule.unit ?? "lbs";
    const w = productWeightInRuleUnit(product.weight, product.weightUnit, ru);
    return isWithinRange(w, rule.min, rule.max);
  }
  if (rule.type === "discount") {
    return productMatchesDiscountRule(rule, product);
  }
  if (rule.type === "inventoryStatus") {
    return productMatchesInventoryStatusRule(rule, product);
  }
  if (rule.type === "inventoryQuantity") {
    if (!product.inventoryTracked) return false;
    return isWithinRange(product.inventoryQuantity, rule.min, rule.max);
  }
  if (rule.type === "newStatus") {
    if (rule.daysOld == null || !Number.isFinite(rule.daysOld)) return false;
    const daysOld = clampNewStatusDaysOld(rule.daysOld);
    if (!product.createdAt) return false;
    const ageMs = now - product.createdAt.getTime();
    return ageMs <= daysOld * 24 * 60 * 60 * 1000;
  }
  return true;
}

/**
 * ISO timestamp for end of the "new" window: `createdAt + N days` (same window as backend `newStatus`).
 */
export function formatNewUntilIso(
  product: NormalizedProduct,
  newRule: Extract<ConditionRule, { type: "newStatus" }>
): string | undefined {
  if (!product.createdAt) return undefined;
  const daysOld = newRule.daysOld;
  if (daysOld == null || !Number.isFinite(daysOld)) return undefined;
  const days = clampNewStatusDaysOld(daysOld);
  const untilMs = product.createdAt.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(untilMs).toISOString();
}

/**
 * Whether to persist `newUntil` on a labelIndex entry for client-side expiry checks.
 */
export function getLabelIndexNewUntil(
  label: Label,
  product: NormalizedProduct,
  now: number = Date.now()
): string | undefined {
  if ((label.applyMode ?? "all") !== "conditions") return undefined;

  const rules = label.conditions.rules;
  const includeSlugs =
    rules.find((r) => r.type === "includeProductSlugs")?.values ?? [];
  if (
    includeSlugs.length > 0 &&
    product.slug &&
    includeSlugs.includes(product.slug)
  ) {
    return undefined;
  }

  const newRule = rules.find(
    (r): r is Extract<ConditionRule, { type: "newStatus" }> =>
      r.type === "newStatus"
  );
  if (!newRule) return undefined;

  const { filters } = splitRules(rules);
  if (!filters.some((f) => f.type === "newStatus")) return undefined;

  const newFilter = filters.find((f) => f.type === "newStatus");
  if (!newFilter || newFilter.type !== "newStatus") return undefined;

  const operator = label.conditions.operator;

  if (operator === "AND") {
    return formatNewUntilIso(product, newRule);
  }

  if (!matchesFilterRule(product, newFilter, now)) return undefined;

  const otherFilters = filters.filter((f) => f.type !== "newStatus");
  const anyOtherMatches = otherFilters.some((rule) =>
    matchesFilterRule(product, rule, now)
  );
  if (anyOtherMatches) return undefined;

  return formatNewUntilIso(product, newRule);
}
