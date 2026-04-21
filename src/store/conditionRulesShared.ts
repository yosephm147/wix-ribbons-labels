import type {
  ConditionGroup,
  ConditionRule,
  Label,
} from "../extensions/dashboard/pages/types";
import type { NormalizedProduct } from "./types";

/** Rule matches if any of the product's inventory flags is among the selected values. */
export function productMatchesInventoryStatusRule(
  rule: Extract<ConditionRule, { type: "inventoryStatus" }>,
  product: NormalizedProduct
): boolean {
  const statuses = product.inventoryStatus;
  return statuses != null && rule.values.every((v) => statuses.includes(v));
}

export function productMatchesDiscountRule(
  rule: Extract<ConditionRule, { type: "discount" }>,
  product: { price: number | null; compareAtPrice: number | null }
): boolean {
  if (
    product.price == null ||
    product.compareAtPrice == null ||
    product.compareAtPrice <= 0 ||
    product.compareAtPrice <= product.price
  ) {
    return false;
  }
  const discountAmount = product.compareAtPrice - product.price;
  const threshold = rule.min ?? 0;
  if (rule.discountKind === "amount") {
    return discountAmount >= threshold;
  }
  const discountPercent = (discountAmount / product.compareAtPrice) * 100;
  return discountPercent >= threshold;
}

/** True when this rule should be kept on persist (checkbox on but empty → false). */
export function conditionRuleHasUsableValue(rule: ConditionRule): boolean {
  switch (rule.type) {
    case "productSlugs":
    case "categories":
    case "excludeCategories":
    case "includeProductSlugs":
    case "excludeProductSlugs":
      return Array.isArray(rule.values) && rule.values.length > 0;
    case "priceRange":
    case "inventoryQuantity":
    case "weightRange": {
      const hasMin = rule.min != null && Number.isFinite(rule.min);
      const hasMax = rule.max != null && Number.isFinite(rule.max);
      return hasMin || hasMax;
    }
    case "discount":
      return rule.min != null && Number.isFinite(rule.min);
    case "inventoryStatus":
      return Array.isArray(rule.values) && rule.values.length > 0;
    case "newStatus":
      return rule.daysOld != null && Number.isFinite(rule.daysOld);
    case "metafield":
      return rule.key.trim().length > 0 && rule.value.trim().length > 0;
    default: {
      const _exhaustive: never = rule;
      return _exhaustive;
    }
  }
}

/** Drop condition rows that are toggled on but have no real filter value before saving. */
export function sanitizeLabelForSave(label: Label): Label {
  const rules = label.conditions.rules.filter(conditionRuleHasUsableValue);
  if (rules.length === label.conditions.rules.length) return label;
  return {
    ...label,
    conditions: { ...label.conditions, rules },
  };
}

/**
 * Biggest allowed value for "added within the last N days."
 * If N is too big, we end up with a cutoff date before Jan 1, 1970, and Wix's filter API fails.
 * So we cap N at roughly "how many days have passed since 1970."
 * Date.now() / (24 * 60 * 60 * 1000) = how many days have passed since Jan 1, 1970.
 */
export function getMaxNewStatusDaysOld(): number {
  return Math.max(1, Math.floor(Date.now() / (24 * 60 * 60 * 1000)));
}

export function clampNewStatusDaysOld(daysOld: number, fallback = 30): number {
  const max = getMaxNewStatusDaysOld();
  if (!Number.isFinite(daysOld)) return Math.min(fallback, max);
  return Math.min(Math.max(1, Math.floor(daysOld)), max);
}

/**
 * Category include/exclude are always applied as a scope (AND together) before
 * other rules, which use the group's operator among themselves.
 */
export function splitConditionRulesForScope(rules: ConditionRule[]): {
  scopeRules: ConditionRule[];
  restRules: ConditionRule[];
} {
  const scopeRules: ConditionRule[] = [];
  const restRules: ConditionRule[] = [];
  for (const r of rules) {
    if (r.type === "categories" || r.type === "excludeCategories") {
      scopeRules.push(r);
    } else {
      restRules.push(r);
    }
  }
  scopeRules.sort((a, b) => {
    if (a.type === "categories" && b.type === "excludeCategories") return -1;
    if (a.type === "excludeCategories" && b.type === "categories") return 1;
    return 0;
  });
  return { scopeRules, restRules };
}

/**
 * True when rules include inventory-only conditions that need the Inventory Items API.
 * In V3, Inventory Status is taken care of in the product search filter.
 * */
export function conditionGroupNeedsProductInventory(
  rules: ConditionGroup | undefined,
  context: "v1" | "v3",
  hasInventoryQuantityInContent: boolean = false
): boolean {
  if (context === "v3" && hasInventoryQuantityInContent) return true;
  if (!rules?.rules.length) return false;
  return rules.rules.some(
    (r) =>
      r.type === "inventoryQuantity" ||
      (context === "v1" && r.type === "inventoryStatus")
  );
}
