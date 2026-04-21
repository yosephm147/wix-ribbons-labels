import type {
  Label,
  ConditionGroup,
  ConditionRule,
  WeightUnit,
  LabelIndexEntryVars,
} from "@/extensions/dashboard/pages/types";
import {
  clampNewStatusDaysOld,
  productMatchesDiscountRule,
  productMatchesInventoryStatusRule,
} from "@/store/conditionRulesShared";
import { productWeightInRuleUnit } from "./weightUnits";
import { getStoreAdapter } from "@/store/adapters/adapterFactory";
import type { StoreAdapter } from "@/store/adapters/storeAdapter";
import type { NormalizedProduct } from "@/store/types";
import { computeLabelVariables, extractVariableIds } from "./labelVariables";
import { getLabelIndexNewUntil } from "./labelIndexNewUntil";

export { formatNewUntilIso, getLabelIndexNewUntil } from "./labelIndexNewUntil";

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

function getRule<T extends ConditionRule["type"]>(
  rules: ConditionRule[],
  type: T
): Extract<ConditionRule, { type: T }> | undefined {
  return rules.find(
    (r): r is Extract<ConditionRule, { type: T }> => r.type === type
  );
}

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

function applyFilters(
  products: NormalizedProduct[],
  rules: ConditionRule[],
  operator: "AND" | "OR"
): NormalizedProduct[] {
  const { filters } = splitRules(rules);
  if (filters.length === 0) return products;

  const now = Date.now();
  return products.filter((product) => {
    const results = filters.map((rule) =>
      matchesFilterRule(product, rule, now)
    );
    return operator === "AND" ? results.every(Boolean) : results.some(Boolean);
  });
}

async function applyOverrides(
  products: NormalizedProduct[],
  rules: ConditionRule[],
  adapter: StoreAdapter
): Promise<NormalizedProduct[]> {
  const includeProductSlugs =
    getRule(rules, "includeProductSlugs")?.values ?? [];
  const excludeProductSlugs = new Set(
    getRule(rules, "excludeProductSlugs")?.values ?? []
  );

  let nextProducts = [...products];
  if (includeProductSlugs.length > 0) {
    const existing = new Set(nextProducts.map((p) => p.slug));
    const missingSlugs = includeProductSlugs.filter((s) => !existing.has(s));
    if (missingSlugs.length > 0) {
      const fetched = await adapter.getProductsBySlugs(missingSlugs);
      nextProducts = nextProducts.concat(fetched);
      for (const product of fetched) existing.add(product.slug);
    }
  }

  if (excludeProductSlugs.size > 0) {
    nextProducts = nextProducts.filter(
      (product) => !excludeProductSlugs.has(product.slug)
    );
  }

  return nextProducts;
}

async function evaluateConditionRules(
  conditions: ConditionGroup,
  hasInventoryQuantityInContent: boolean = false
): Promise<NormalizedProduct[]> {
  const adapter = await getStoreAdapter();
  let candidates: NormalizedProduct[] = [];

  const onlyIncludeRule =
    conditions.rules.length === 1 &&
    conditions.rules[0]!.type === "includeProductSlugs";

  if (!onlyIncludeRule) {
    candidates = await adapter.searchProducts(
      conditions,
      true,
      hasInventoryQuantityInContent
    );
  }

  const filtered = applyFilters(
    candidates,
    conditions.rules,
    conditions.operator
  );
  const overridden = await applyOverrides(filtered, conditions.rules, adapter);
  const uniqueBySlug = new Map<string, NormalizedProduct>();
  for (const product of overridden) {
    if (product.slug) uniqueBySlug.set(product.slug, product);
  }
  return [...uniqueBySlug.values()];
}

function getProductSlugsFromLabel(label: Label): string[] {
  const productSlugsRule = label.conditions.rules.find(
    (r): r is ConditionRule & { type: "productSlugs" } =>
      r.type === "productSlugs"
  );
  return productSlugsRule?.values ?? [];
}

/** Contribution of a single label to the index (for incremental updates). */
async function getIndexEntryForLabel(label: Label): Promise<{
  labelId: string;
  products: NormalizedProduct[] | null;
  isDefault: boolean;
}> {
  if (!label.enabled)
    return { labelId: label.id, products: null, isDefault: false };
  const applyMode = label.applyMode ?? "all";
  if (applyMode === "all")
    return { labelId: label.id, products: null, isDefault: true };
  if (applyMode === "specific") {
    const adapter = await getStoreAdapter();
    const slugs = getProductSlugsFromLabel(label);
    const products = await adapter.getProductsBySlugs(slugs);
    return {
      labelId: label.id,
      products,
      isDefault: false,
    };
  }
  const requiredVarIds = extractVariableIds(label.text?.message ?? "");
  const hasInventoryQuantityInContent =
    requiredVarIds.includes("inventory_quantity");
  const products = await evaluateConditionRules(
    label.conditions,
    hasInventoryQuantityInContent
  );
  return { labelId: label.id, products, isDefault: false };
}

/**
 * Update only one label's entry in the index. Use when a single label is added/updated
 * so other labels are not re-evaluated.
 */
export async function mergeLabelIntoIndex(
  labelIndex: Record<string, Record<string, LabelIndexEntryVars>>,
  defaultLabelIds: string[],
  label: Label
): Promise<{
  labelIndex: Record<string, Record<string, LabelIndexEntryVars>>;
  defaultLabelIds: string[];
}> {
  const nextLabelIndex = { ...labelIndex };
  const nextDefaultLabelIds = defaultLabelIds.filter((id) => id !== label.id);
  delete nextLabelIndex[label.id];

  const entry = await getIndexEntryForLabel(label);
  if (entry.isDefault) {
    nextDefaultLabelIds.push(label.id);
  } else if (entry.products !== null) {
    const requiredVarIds = extractVariableIds(label.text?.message ?? "");
    const productMap: Record<string, LabelIndexEntryVars> = {};
    for (const product of entry.products) {
      if (!product.slug) continue;
      const newUntil = getLabelIndexNewUntil(label, product);
      productMap[product.slug] = {
        ...computeLabelVariables(product, requiredVarIds),
        productId: product.id,
        ...(newUntil != null ? { newUntil } : {}),
      };
    }
    nextLabelIndex[label.id] = productMap;
  }

  return { labelIndex: nextLabelIndex, defaultLabelIds: nextDefaultLabelIds };
}

/**
 * Remove one label from the index. Use when a label is deleted.
 */
export function removeLabelFromIndex(
  labelIndex: Record<string, Record<string, LabelIndexEntryVars>>,
  defaultLabelIds: string[],
  labelId: string
): {
  labelIndex: Record<string, Record<string, LabelIndexEntryVars>>;
  defaultLabelIds: string[];
} {
  const nextLabelIndex = { ...labelIndex };
  delete nextLabelIndex[labelId];
  const nextDefaultLabelIds = defaultLabelIds.filter((id) => id !== labelId);
  return { labelIndex: nextLabelIndex, defaultLabelIds: nextDefaultLabelIds };
}
