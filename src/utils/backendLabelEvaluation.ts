/**
 * Single-product label evaluation for backend event handlers.
 *
 * Mirrors the batch evaluation in evaluateLabels.ts but operates on one product
 * at a time so we can update the labelIndex incrementally from webhook events.
 */

import type {
  Label,
  LabelsConfig,
  ConditionGroup,
  ConditionRule,
  LabelIndexEntryVars,
} from "../extensions/dashboard/pages/types";
import type { NormalizedProduct } from "../store/types";
import {
  splitConditionRulesForScope,
  clampNewStatusDaysOld,
  productMatchesDiscountRule,
  productMatchesInventoryStatusRule,
  conditionRuleHasUsableValue,
} from "../store/conditionRulesShared";
import { productWeightInRuleUnit } from "./weightUnits";
import { computeLabelVariables, extractVariableIds } from "./labelVariables";
import { getLabelIndexNewUntil } from "./labelIndexNewUntil";
import type { products, productsV3 } from "@wix/stores";
import { parseInventoryStatusV3 } from "./parseInventoryStatusV3";

// ---------------------------------------------------------------------------
// Product normalization (self-contained — avoids importing v3Adapter which
// pulls in browser-only constants from the editor preview components).
// ---------------------------------------------------------------------------

type V3Product = productsV3.V3Product;
type V1Product = products.Product;
type SlugOverrideRule = Extract<
  ConditionRule,
  { type: "includeProductSlugs" | "excludeProductSlugs" }
>;

function isSlugOverrideRule(rule: ConditionRule): rule is SlugOverrideRule {
  return (
    rule.type === "includeProductSlugs" || rule.type === "excludeProductSlugs"
  );
}

function parseMoneyAmount(value: string | undefined | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize a V3Product for evaluation.
 * @param v3Product - The V3Product to normalize.
 * @param inventoryTracked - Whether the product has inventory tracked and it's being called from a inventory webhook event.
 * @returns The normalized product.
 */
export function normalizeV3ProductForEval(
  v3Product: V3Product
): NormalizedProduct | null {
  if (!v3Product) return null;
  const id = v3Product._id;
  if (typeof id !== "string" || !id) return null;

  const price =
    parseMoneyAmount(v3Product.actualPriceRange?.minValue?.amount) ??
    parseMoneyAmount(v3Product.actualPriceRange?.maxValue?.amount);

  const compareAtPrice =
    parseMoneyAmount(v3Product.compareAtPriceRange?.minValue?.amount) ??
    parseMoneyAmount(v3Product.compareAtPriceRange?.maxValue?.amount);

  const wr = v3Product.physicalProperties?.shippingWeightRange;
  let weight: number | null = null;
  if (wr?.minValue != null && Number.isFinite(wr.minValue))
    weight = wr.minValue;
  else if (wr?.maxValue != null && Number.isFinite(wr.maxValue))
    weight = wr.maxValue;

  const weightUnit =
    v3Product.physicalProperties?.weightMeasurementUnitInfo
      ?.weightMeasurementUnit ?? null;

  const categoryIdsSet = new Set<string>();
  for (const cat of v3Product.allCategoriesInfo?.categories ?? []) {
    if (typeof cat._id === "string" && cat._id) categoryIdsSet.add(cat._id);
  }
  if (
    typeof v3Product.mainCategoryId === "string" &&
    v3Product.mainCategoryId
  ) {
    categoryIdsSet.add(v3Product.mainCategoryId);
  }

  const created =
    v3Product._createdDate instanceof Date &&
    !Number.isNaN(v3Product._createdDate.getTime())
      ? v3Product._createdDate
      : null;

  // inventory.availabilityStatus is present on webhook entity payloads even
  // though the SDK's V3Product type doesn't declare it.
  const inventoryStatus = parseInventoryStatusV3(v3Product);

  return {
    id,
    name: v3Product.name ?? "",
    slug: v3Product.slug ?? "",
    imageUrl: v3Product.media?.main?.thumbnail?.url || undefined,
    categoryIds: [...categoryIdsSet],
    price,
    compareAtPrice,
    weight,
    weightUnit,
    inventoryStatus,
    inventoryQuantity: null,
    inventoryTracked: null,
    createdAt: created,
  };
}

// ---------------------------------------------------------------------------
// Single-product label evaluation
// ---------------------------------------------------------------------------

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

function matchesSingleRule(
  product: NormalizedProduct,
  rule: ConditionRule,
  now: number,
  alreadyIn: boolean
): boolean {
  switch (rule.type) {
    case "categories":
      return rule.values.some((id) => product.categoryIds.includes(id));
    case "excludeCategories":
      return !rule.values.some((id) => product.categoryIds.includes(id));
    case "priceRange":
      return isWithinRange(product.price, rule.min, rule.max);
    case "weightRange": {
      const w = productWeightInRuleUnit(
        product.weight,
        product.weightUnit,
        rule.unit ?? "lbs"
      );
      return isWithinRange(w, rule.min, rule.max);
    }
    case "discount":
      return productMatchesDiscountRule(rule, product);
    case "inventoryStatus":
      // Re-evaluate only when inventory status is explicitly not null.
      if (product.inventoryStatus == null) return alreadyIn;
      return productMatchesInventoryStatusRule(rule, product);
    case "inventoryQuantity":
      // Re-evaluate only when inventory tracking is explicitly known as true.
      if (product.inventoryTracked == null) return alreadyIn;
      if (!product.inventoryTracked) return false;
      return isWithinRange(product.inventoryQuantity, rule.min, rule.max);
    case "newStatus": {
      if (rule.daysOld == null || !Number.isFinite(rule.daysOld)) return false;
      const daysOld = clampNewStatusDaysOld(rule.daysOld);
      if (!product.createdAt) return false;
      return now - product.createdAt.getTime() <= daysOld * 24 * 60 * 60 * 1000;
    }
    // Overrides are handled separately in evaluateConditionGroup
    case "includeProductSlugs":
    case "excludeProductSlugs":
    case "metafield":
      return false;
    default:
      return false;
  }
}

/**
 * Mirrors the batch evaluation pipeline in evaluateLabels.ts:
 *   1. Scope rules (categories / excludeCategories) always AND together.
 *   2. Remaining non-override rules use the group operator.
 *   3. includeProductSlugs adds the product regardless of filters.
 *   4. excludeProductSlugs removes the product regardless (wins over includes).
 */
function evaluateConditionGroup(
  product: NormalizedProduct,
  conditions: ConditionGroup,
  alreadyIn: boolean
): boolean {
  const { scopeRules, restRules } = splitConditionRulesForScope(
    conditions.rules
  );

  const overrideRules = restRules.filter(isSlugOverrideRule);
  const filterRules = restRules.filter((rule) => !isSlugOverrideRule(rule));

  const now = Date.now();

  const isExcluded = overrideRules.some(
    (r) => r.type === "excludeProductSlugs" && r.values.includes(product.slug)
  );
  if (isExcluded) return false;

  const isForceIncluded = overrideRules.some(
    (r) => r.type === "includeProductSlugs" && r.values.includes(product.slug)
  );
  if (isForceIncluded) return true;

  const passesScope = scopeRules.every((r) =>
    matchesSingleRule(product, r, now, alreadyIn)
  );
  if (!passesScope) return false;

  const passesFilters =
    filterRules.length === 0
      ? true
      : conditions.operator === "AND"
      ? filterRules.every((r) => matchesSingleRule(product, r, now, alreadyIn))
      : filterRules.some((r) => matchesSingleRule(product, r, now, alreadyIn));

  return passesScope && passesFilters;
}

/**
 * Whether a product matches a label's criteria.
 * Returns true for `applyMode === "all"` labels — callers should skip those
 * when updating the per-product labelIndex (they live in defaultLabelIds instead).
 */
export function evaluateProductAgainstLabel(
  product: NormalizedProduct,
  label: Label,
  alreadyIn = false
): boolean {
  if (!label.enabled) return false;

  const applyMode = label.applyMode ?? "all";
  if (applyMode === "all") return true;

  if (applyMode === "specific") {
    const slugsRule = label.conditions.rules.find(
      (r) => r.type === "productSlugs"
    );
    if (!slugsRule || slugsRule.type !== "productSlugs") return false;
    return slugsRule.values.includes(product.slug);
  }

  // applyMode === "conditions"
  return evaluateConditionGroup(product, label.conditions, alreadyIn);
}

/**
 * Return a new LabelsConfig with labelIndex updated for the given product.
 * Only updates entries for labels that use per-product tracking (specific / conditions).
 * Labels with applyMode "all" are left untouched (they live in defaultLabelIds).
 */
export function updateLabelIndexForProduct(
  product: NormalizedProduct,
  config: LabelsConfig
): LabelsConfig {
  let changed = false;
  const nextLabelIndex = { ...config.labelIndex };

  for (const label of config.labels) {
    const applyMode = label.applyMode ?? "all";
    if (!label.enabled || applyMode === "all") continue;

    const current = nextLabelIndex[label.id] ?? {};
    const alreadyIn = Object.prototype.hasOwnProperty.call(
      current,
      product.slug
    );
    const matches = evaluateProductAgainstLabel(product, label, alreadyIn);

    if (matches) {
      const requiredVarIds = extractVariableIds(label.text?.message ?? "");
      const newUntil = getLabelIndexNewUntil(label, product);
      const nextVars: LabelIndexEntryVars = {
        ...computeLabelVariables(product, requiredVarIds),
        productId: product.id,
        ...(newUntil != null ? { newUntil } : {}),
      };
      const prevVars = current[product.slug];
      const sameVars =
        prevVars != null &&
        JSON.stringify(prevVars) === JSON.stringify(nextVars) &&
        alreadyIn;
      if (!sameVars) {
        nextLabelIndex[label.id] = {
          ...current,
          [product.slug]: nextVars,
        };
        changed = true;
      }
    } else if (alreadyIn) {
      const nextForLabel: Record<string, LabelIndexEntryVars> = { ...current };
      delete nextForLabel[product.slug];
      nextLabelIndex[label.id] = nextForLabel;
      changed = true;
    }
  }

  if (!changed) return config;
  return { ...config, labelIndex: nextLabelIndex };
}

/**
 * Remove every labelIndex row whose stored `productId` matches (no catalog calls).
 */
export function removeProductFromLabelIndexByProductId(
  productId: string,
  config: LabelsConfig
): LabelsConfig | null {
  if (!productId) return null;
  let changed = false;
  const nextLabelIndex = { ...config.labelIndex };

  for (const [labelId, productMap] of Object.entries(config.labelIndex)) {
    const nextMap = { ...productMap };
    let labelChanged = false;
    for (const [slug, vars] of Object.entries(productMap)) {
      if (vars?.productId === productId) {
        delete nextMap[slug];
        labelChanged = true;
      }
    }
    if (labelChanged) {
      nextLabelIndex[labelId] = nextMap;
      changed = true;
    }
  }

  if (!changed) return null;
  return { ...config, labelIndex: nextLabelIndex };
}

/** Remove one slug key from every label’s labelIndex map (V3 delete events include slug). */
export function removeProductSlugFromLabelIndex(
  targetKey: string,
  config: LabelsConfig
): LabelsConfig | null {
  if (!targetKey) return null;
  let changed = false;
  const nextLabelIndex = { ...config.labelIndex };

  for (const [labelId, productMap] of Object.entries(config.labelIndex)) {
    if (Object.prototype.hasOwnProperty.call(productMap, targetKey)) {
      nextLabelIndex[labelId] = { ...productMap };
      delete nextLabelIndex[labelId][targetKey];
      changed = true;
    }
  }

  if (!changed) return null;
  return { ...config, labelIndex: nextLabelIndex };
}

/**
 * When a catalog scope id used in label conditions no longer exists (V1 **collection** id
 * or V3 **category** id in `categories` / `excludeCategories`), remove it from both rule
 * types, drop rules that become empty, and set the label inactive when removed from
 * either include or exclude category rules.
 */
export function applyCatalogScopeIdDeletedToLabelsConfig(
  scopeId: string,
  config: LabelsConfig
): LabelsConfig | null {
  if (!scopeId) return null;

  let anyChange = false;
  const nextLabelIndex = { ...config.labelIndex };
  const labels = config.labels.map((label) => {
    let removedFromEither = false;
    const nextRules = label.conditions.rules
      .map((rule) => {
        if (rule.type !== "categories" && rule.type !== "excludeCategories") {
          return rule;
        }
        if (!rule.values.includes(scopeId)) return rule;
        removedFromEither = true;
        return {
          ...rule,
          values: rule.values.filter((id) => id !== scopeId),
        };
      })
      .filter(conditionRuleHasUsableValue);

    if (!removedFromEither) return label;
    anyChange = true;
    if (Object.keys(nextLabelIndex[label.id] ?? {}).length > 0) {
      nextLabelIndex[label.id] = {};
    }
    return {
      ...label,
      enabled: false,
      conditions: { ...label.conditions, rules: nextRules },
    };
  });

  if (!anyChange) return null;
  return { ...config, labels, labelIndex: nextLabelIndex };
}
