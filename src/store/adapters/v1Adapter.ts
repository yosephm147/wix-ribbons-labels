import { NO_IMAGE_PRODUCT_IMAGE } from "../productImagePlaceholders";
import type {
  ConditionGroup,
  ConditionRule,
  InventoryStatusValue,
  WeightUnit,
} from "../../extensions/dashboard/pages/types";
import {
  parseStoreWeightUnit,
  productWeightInRuleUnit,
} from "../../utils/weightUnits";
import type {
  NormalizedProduct,
  ProductPreview,
  SearchOption,
} from "../types";
import {
  clampNewStatusDaysOld,
  conditionGroupNeedsProductInventory,
  productMatchesDiscountRule,
  productMatchesInventoryStatusRule,
  splitConditionRulesForScope,
} from "../conditionRulesShared";
import type { StoreAdapter } from "./storeAdapter";
import { collections, inventory, products } from "@wix/stores";

const LIMIT = 20;
const CATEGORY_SEARCH_LIMIT = 20;

/** Resolved once per session from a sample V1 product’s weight unit. */
let cachedCatalogDefaultWeightUnitV1: WeightUnit | undefined;

export async function getCatalogDefaultWeightUnitV1(): Promise<WeightUnit> {
  if (cachedCatalogDefaultWeightUnitV1 !== undefined) {
    return cachedCatalogDefaultWeightUnitV1;
  }
  try {
    const res = await products.queryProducts().limit(1).find();
    const p = res.items?.[0];
    const raw = p?.pricePerUnitData?.totalMeasurementUnit;
    const parsed = raw != null ? parseStoreWeightUnit(String(raw)) : null;
    cachedCatalogDefaultWeightUnitV1 = parsed ?? "lbs";
  } catch {
    cachedCatalogDefaultWeightUnitV1 = "lbs";
  }
  return cachedCatalogDefaultWeightUnitV1 ?? "lbs";
}

async function getCategoryV1(categoryId: string): Promise<SearchOption> {
  const category = await collections.getCollection(categoryId);
  return { id: categoryId, label: category.name!, slug: category.slug! };
}

async function searchCategoriesV1(input: string): Promise<SearchOption[]> {
  const trimmed = input.trim();
  const builder = trimmed
    ? collections
        .queryCollections()
        .startsWith("name", trimmed)
        .limit(CATEGORY_SEARCH_LIMIT)
    : collections.queryCollections().limit(CATEGORY_SEARCH_LIMIT);
  const result = await builder.find();
  const items = result.items ?? [];
  return items
    .filter(
      (c): c is { _id: string; name?: string | null; slug?: string | null } =>
        !!c._id && !!c.slug && !!c.name
    )
    .map((c) => ({ id: c._id, label: c.name!, slug: c.slug! }));
}

export function normalizeProductV1(
  p: products.Product
): NormalizedProduct | null {
  const id = p._id;
  if (typeof id !== "string" || !id) return null;

  const pd = p.priceData ?? p.price;
  const list = pd?.price;
  const disc = pd?.discountedPrice;
  let price: number | null = null;
  let compareAtPrice: number | null = null;
  if (
    list != null &&
    disc != null &&
    Number.isFinite(list) &&
    Number.isFinite(disc) &&
    disc < list
  ) {
    price = disc;
    compareAtPrice = list;
  } else if (list != null && Number.isFinite(list)) {
    price = list;
  } else if (disc != null && Number.isFinite(disc)) {
    price = disc;
  } else {
    const r = p.priceRange?.minValue ?? p.priceRange?.maxValue;
    if (r != null && Number.isFinite(r)) price = r;
  }

  const wr = p.weightRange;
  let weight: number | null = null;
  if (wr?.minValue != null && Number.isFinite(wr.minValue))
    weight = wr.minValue;
  else if (wr?.maxValue != null && Number.isFinite(wr.maxValue))
    weight = wr.maxValue;
  else if (p.weight != null && Number.isFinite(p.weight)) weight = p.weight;

  const weightUnit = p.pricePerUnitData?.totalMeasurementUnit ?? null;

  const created =
    p._createdDate instanceof Date && !Number.isNaN(p._createdDate.getTime())
      ? p._createdDate
      : null;

  return {
    id,
    name: p.name ?? "",
    slug: p.slug ?? "",
    imageUrl: p.media?.mainMedia?.image?.url || undefined,
    categoryIds: [...(p.collectionIds ?? [])],
    price,
    compareAtPrice,
    weight,
    weightUnit: weightUnit,
    inventoryStatus: null,
    inventoryQuantity: null,
    inventoryTracked: p.stock?.trackInventory ?? null,
    createdAt: created,
  };
}

/** Derives per–inventory-row status from V1 inventory (mirrors V3 row semantics used in getInventoryFilters). */
function isV1InventoryItemInStock(item: inventory.InventoryItemV2): boolean {
  const variants = item.variants ?? [];
  for (const v of variants) {
    if (v.inStock) return true;
  }
  return false;
}

function isV1InventoryItemPreorderEnabled(
  item: inventory.InventoryItemV2
): boolean {
  return item.preorderInfo?.enabled === true;
}

function getV1InventoryItemTotalQuantity(
  item: inventory.InventoryItemV2
): number | null {
  if (item.trackQuantity !== true) return null;
  let sum = 0;
  let any = false;
  for (const v of item.variants ?? []) {
    const q = v.quantity;
    if (typeof q === "number" && Number.isFinite(q)) {
      sum += q;
      any = true;
    }
  }
  return any ? sum : null;
}

function matchV1ItemInventoryStatus(
  item: inventory.InventoryItemV2,
  values: InventoryStatusValue[]
): boolean {
  const preorderEnabled = isV1InventoryItemPreorderEnabled(item);
  const inStock = isV1InventoryItemInStock(item);
  let statuses: InventoryStatusValue[] = [];
  if (preorderEnabled) statuses.push("availableForPreorder");
  if (inStock) statuses.push("inStock");
  else statuses.push("outOfStock");

  return values.every((v) => statuses.includes(v));
}

function matchV1ItemInventoryQuantity(
  item: inventory.InventoryItemV2,
  rule: Extract<ConditionRule, { type: "inventoryQuantity" }>
): boolean {
  const hasMin = rule.min != null && Number.isFinite(rule.min);
  const hasMax = rule.max != null && Number.isFinite(rule.max);
  if (!hasMin && !hasMax) return true;
  const qty = getV1InventoryItemTotalQuantity(item);
  if (qty == null) return false;
  if (hasMin && qty < rule.min!) return false;
  if (hasMax && qty > rule.max!) return false;
  return true;
}

/** Same combination as getInventoryFilters (only inventoryStatus / inventoryQuantity clauses). */
function v1InventoryItemMatchesInventoryRules(
  item: inventory.InventoryItemV2,
  rules: ConditionGroup
): boolean {
  const isAnd = rules.operator === "AND";
  const matches: boolean[] = [];
  for (const rule of rules.rules) {
    if (rule.type === "inventoryStatus") {
      matches.push(matchV1ItemInventoryStatus(item, rule.values));
    } else if (rule.type === "inventoryQuantity") {
      matches.push(matchV1ItemInventoryQuantity(item, rule));
    }
  }
  if (matches.length === 0) return true;
  return isAnd ? matches.every(Boolean) : matches.some(Boolean);
}

function filterV1InventoryByConditionGroup(
  out: Record<string, inventory.InventoryItemV2[]>,
  rules: ConditionGroup
): Record<string, inventory.InventoryItemV2[]> {
  const next: Record<string, inventory.InventoryItemV2[]> = {};
  for (const [pid, items] of Object.entries(out)) {
    const filtered = items.filter((row) =>
      v1InventoryItemMatchesInventoryRules(row, rules)
    );
    if (filtered.length > 0) next[pid] = filtered;
  }
  return next;
}

async function fetchAllProductsV1(
  queryBuilder: products.ProductsQueryBuilder
): Promise<products.Product[]> {
  const allItems: products.Product[] = [];
  let res = await queryBuilder.limit(LIMIT).find();
  while (true) {
    allItems.push(...res.items);
    if (!res.hasNext()) break;
    res = await res.next();
  }
  return allItems;
}

/** Non-scope rules only; category scope is already on the query builder (`scopedBase`). */
function matchesConditionGroupV1(
  product: NormalizedProduct,
  rules: ConditionGroup
): boolean {
  const restRules = rules.rules.filter(
    (r) =>
      r.type !== "categories" &&
      r.type !== "excludeCategories" &&
      r.type !== "productSlugs" &&
      r.type !== "includeProductSlugs" &&
      r.type !== "excludeProductSlugs"
  );
  if (restRules.length === 0) return true;

  const now = Date.now();
  if (rules.operator === "AND") {
    return restRules.every((rule) =>
      normalizedProductMatchesV1Rule(product, rule, now)
    );
  }
  return restRules.some((rule) =>
    normalizedProductMatchesV1Rule(product, rule, now)
  );
}

/**
 * Paginates `base` (already narrowed by category scope), filtering each page client-side.
 * Used when the OR group has a non-narrowing rule so server-side OR queries cannot
 * narrow the catalog (V1 fallback).
 */
async function fetchProductsV1OrFallbackPageByPage(
  base: products.ProductsQueryBuilder,
  rules: ConditionGroup
): Promise<NormalizedProduct[]> {
  const out: NormalizedProduct[] = [];
  let res = await base.limit(LIMIT).find();
  while (true) {
    let batch = res.items
      .map((p) => normalizeProductV1(p))
      .filter((p): p is NormalizedProduct => p != null);
    if (batch.length > 0) {
      batch = await maybeMergeInventoryV1FromRules(batch, rules);
      for (const p of batch) {
        if (matchesConditionGroupV1(p, rules)) {
          out.push(p);
        }
      }
    }
    if (!res.hasNext()) break;
    res = await res.next();
  }
  return out;
}

function applyCategoryScopeToV1Builder(
  builder: products.ProductsQueryBuilder,
  scopeRules: ConditionRule[]
): products.ProductsQueryBuilder {
  return scopeRules.reduce(
    (b, rule) => applyProductFilterRuleV1(b, rule),
    builder
  );
}

function applyRestRulesToV1BuilderAND(
  builder: products.ProductsQueryBuilder,
  restRules: ConditionRule[]
): products.ProductsQueryBuilder {
  return restRules.reduce(
    (b, rule) => applyProductFilterRuleV1(b, rule),
    builder
  );
}

async function searchProductsV1(
  builder?: products.ProductsQueryBuilder,
  rules?: ConditionGroup
): Promise<NormalizedProduct[]> {
  const base = builder ?? products.queryProducts();

  if (!rules || rules.rules.length === 0) {
    const allItems = await fetchAllProductsV1(base);
    const normalizedProducts = allItems
      .map((p) => normalizeProductV1(p))
      .filter((p): p is NormalizedProduct => p != null);
    return normalizedProducts;
  }

  const { scopeRules, restRules } = splitConditionRulesForScope(rules.rules);
  const scopedBase = applyCategoryScopeToV1Builder(base, scopeRules);

  const useMultiQueryOr = rules.operator === "OR" && restRules.length > 1;

  const orPathNeedsClientFallback =
    useMultiQueryOr && v1OrGroupHasNonNarrowingRule(rules.rules);

  if (orPathNeedsClientFallback) {
    return fetchProductsV1OrFallbackPageByPage(scopedBase, rules);
  }

  let allItems: products.Product[];

  if (useMultiQueryOr && !orPathNeedsClientFallback) {
    const pages = await Promise.all(
      restRules.map((rule) =>
        fetchAllProductsV1(applyProductFilterRuleV1(scopedBase, rule))
      )
    );
    const byId = new Map<string, products.Product>();
    for (const page of pages) {
      for (const p of page) {
        const id = p._id;
        if (typeof id === "string" && id && !byId.has(id)) {
          byId.set(id, p);
        }
      }
    }
    allItems = [...byId.values()];
  } else {
    let queryBuilder = scopedBase;
    if (restRules.length > 0) {
      queryBuilder = applyRestRulesToV1BuilderAND(scopedBase, restRules);
    }
    allItems = await fetchAllProductsV1(queryBuilder);
  }

  let normalizedProducts = allItems
    .map((p) => normalizeProductV1(p))
    .filter((p): p is NormalizedProduct => p != null);

  if (rules) {
    normalizedProducts = await maybeMergeInventoryV1FromRules(
      normalizedProducts,
      rules
    );
  }

  return normalizedProducts;
}

const INVENTORY_QUERY_PAGE_LIMIT = 100;
const INVENTORY_PRODUCT_ID_CHUNK = 100;

async function fetchInventoryV1ItemsByProductId(
  productIds: string[],
  rules?: ConditionGroup
): Promise<Record<string, inventory.InventoryItemV2[]>> {
  const out: Record<string, inventory.InventoryItemV2[]> = {};
  const unique = [...new Set(productIds.filter(Boolean))];
  for (let i = 0; i < unique.length; i += INVENTORY_PRODUCT_ID_CHUNK) {
    const chunk = unique.slice(i, i + INVENTORY_PRODUCT_ID_CHUNK);
    let offset = 0;
    while (true) {
      const response = await inventory.queryInventory({
        query: {
          filter: JSON.stringify({
            productId: {
              $in: chunk,
            },
          }),
          paging: { limit: INVENTORY_QUERY_PAGE_LIMIT, offset },
        },
      });
      const items = response.inventoryItems ?? [];
      for (const item of items) {
        const pid = item.productId;
        if (typeof pid !== "string" || !pid) continue;
        if (!out[pid]) out[pid] = [];
        out[pid].push(item);
      }
      if (items.length === 0) break;
      if (items.length < INVENTORY_QUERY_PAGE_LIMIT) break;
      offset += items.length;
    }
  }

  if (rules) {
    return filterV1InventoryByConditionGroup(out, rules);
  }
  return out;
}

async function maybeMergeInventoryV1FromRules(
  productsList: NormalizedProduct[],
  rules: ConditionGroup
): Promise<NormalizedProduct[]> {
  if (
    !rules ||
    !conditionGroupNeedsProductInventory(rules, "v1") ||
    productsList.length === 0
  ) {
    return productsList;
  }

  const byProductId = await fetchInventoryV1ItemsByProductId(
    productsList.map((p) => p.id),
    rules
  );

  return productsList
    .filter((p) => p.id in byProductId)
    .map((p) => applyInventoryV1ToNormalizedProduct(p, byProductId[p.id]));
}

/** Merge V1 inventory rows into product fields (same role as applyInventoryV3ToNormalizedProduct). */
export function applyInventoryV1ToNormalizedProduct(
  product: NormalizedProduct,
  inventoryItems: inventory.InventoryItemV2[]
): NormalizedProduct {
  if (!inventoryItems.length) return product;

  const inventoryTracked = inventoryItems.some((i) => i.trackQuantity === true);

  let quantitySum = 0;
  let counted = false;
  for (const item of inventoryItems) {
    if (item.trackQuantity !== true) continue;
    const q = getV1InventoryItemTotalQuantity(item);
    if (typeof q === "number" && Number.isFinite(q)) {
      quantitySum += q;
      counted = true;
    }
  }

  const inStock = inventoryItems.some(isV1InventoryItemInStock);
  const preorderEnabled = inventoryItems.some(isV1InventoryItemPreorderEnabled);

  const inventoryStatus: InventoryStatusValue[] = [];
  if (inStock) inventoryStatus.push("inStock");
  else inventoryStatus.push("outOfStock");

  if (preorderEnabled) inventoryStatus.push("availableForPreorder");

  return {
    ...product,
    inventoryStatus,
    inventoryQuantity: counted ? quantitySum : null,
    inventoryTracked,
  };
}

function applyProductFilterRuleV1(
  builder: products.ProductsQueryBuilder,
  rule: ConditionRule
): products.ProductsQueryBuilder {
  switch (rule.type) {
    case "categories":
      return builder.hasSome("collectionIds", rule.values);
    case "excludeCategories":
      return builder.ne("collectionIds", rule.values);
    case "priceRange": {
      let b = builder;
      if (rule.min != null && Number.isFinite(rule.min)) {
        b = b.ge("priceData.price", rule.min);
      }
      if (rule.max != null && Number.isFinite(rule.max)) {
        b = b.le("priceData.price", rule.max);
      }
      return b;
    }
    case "newStatus": {
      if (rule.daysOld == null || !Number.isFinite(rule.daysOld))
        return builder;
      const days = clampNewStatusDaysOld(rule.daysOld);
      return builder.ge(
        "_createdDate",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      );
    }
    case "productSlugs":
      return rule.values.length > 0 ? builder.in("slug", rule.values) : builder;
    case "includeProductSlugs":
    case "excludeProductSlugs":
      return builder;
    case "weightRange":
    case "discount":
    case "inventoryStatus":
    case "inventoryQuantity":
    case "metafield":
    default:
      return builder;
  }
}

/** True if `applyProductFilterRuleV1` adds at least one constraint (not a no-op). */
function v1RuleNarrowsCatalog(rule: ConditionRule): boolean {
  switch (rule.type) {
    case "categories":
    case "excludeCategories":
      return Array.isArray(rule.values) && rule.values.length > 0;
    case "priceRange":
      return (
        (rule.min != null && Number.isFinite(rule.min)) ||
        (rule.max != null && Number.isFinite(rule.max))
      );
    case "newStatus":
      return true;
    case "productSlugs":
      return Array.isArray(rule.values) && rule.values.length > 0;
    case "includeProductSlugs":
    case "excludeProductSlugs":
      return false;
    case "weightRange":
    case "discount":
    case "inventoryStatus":
    case "inventoryQuantity":
    case "metafield":
    default:
      return false;
  }
}

/** Rest rules only (category scope is applied separately on the query builder). */
function v1OrGroupHasNonNarrowingRule(restRules: ConditionRule[]): boolean {
  return restRules.some((r) => !v1RuleNarrowsCatalog(r));
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

/** Client-side evaluation for one non-scope rule (V1 OR fallback path; scope is on the query). */
function normalizedProductMatchesV1Rule(
  product: NormalizedProduct,
  rule: ConditionRule,
  _now: number
): boolean {
  switch (rule.type) {
    case "priceRange": {
      const hasMin = rule.min != null && Number.isFinite(rule.min);
      const hasMax = rule.max != null && Number.isFinite(rule.max);
      if (!hasMin && !hasMax) return true;
      return isWithinRange(product.price, rule.min, rule.max);
    }
    case "newStatus": {
      if (rule.daysOld == null || !Number.isFinite(rule.daysOld)) return false;
      const daysOld = clampNewStatusDaysOld(rule.daysOld);
      if (!product.createdAt) return false;
      const ageMs = Date.now() - product.createdAt.getTime();
      return ageMs <= daysOld * 24 * 60 * 60 * 1000;
    }
    case "productSlugs":
      return rule.values.includes(product.slug);
    case "weightRange": {
      const hasMin = rule.min != null && Number.isFinite(rule.min);
      const hasMax = rule.max != null && Number.isFinite(rule.max);
      if (!hasMin && !hasMax) return true;
      const ru: WeightUnit = rule.unit ?? "lbs";
      const w = productWeightInRuleUnit(product.weight, product.weightUnit, ru);
      return isWithinRange(w, rule.min, rule.max);
    }
    case "discount":
      return productMatchesDiscountRule(rule, product);
    case "inventoryStatus":
      return productMatchesInventoryStatusRule(rule, product);
    case "inventoryQuantity": {
      if (!product.inventoryTracked) return false;
      const hasMin = rule.min != null && Number.isFinite(rule.min);
      const hasMax = rule.max != null && Number.isFinite(rule.max);
      if (!hasMin && !hasMax) return true;
      return isWithinRange(product.inventoryQuantity, rule.min, rule.max);
    }
    case "metafield":
      return false;
    default:
      return false;
  }
}

export function createV1Adapter(): StoreAdapter {
  return {
    async searchProducts(rules) {
      return searchProductsV1(undefined, rules);
    },

    async getProductsBySlugs(slugs: string[]) {
      const unique = [...new Set(slugs.filter(Boolean))];
      if (unique.length === 0) return [];

      const allItems = await fetchAllProductsV1(
        products.queryProducts().in("slug", unique)
      );
      const normalized = allItems
        .map((p) => normalizeProductV1(p))
        .filter((p): p is NormalizedProduct => p != null);
      const bySlug = new Map(normalized.map((p) => [p.slug, p]));
      return unique
        .map((s) => bySlug.get(s))
        .filter((p): p is NormalizedProduct => p != null);
    },

    async searchProductsByName(name: string) {
      const trimmed = name?.trim();
      const items = await searchProductsV1(
        products.queryProducts().startsWith("name", trimmed || "")
      );
      return items.map((p) => ({
        id: p.id,
        label: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl ?? NO_IMAGE_PRODUCT_IMAGE,
      }));
    },

    async getProduct(slug: string) {
      const res = await products
        .queryProducts()
        .eq("slug", slug)
        .limit(1)
        .find();
      const p = res.items?.[0];
      if (!p?._id) {
        throw new Error(`Product not found: ${slug}`);
      }
      return {
        id: p._id,
        label: p.name!,
        slug: p.slug ?? slug,
        imageUrl: p.media?.mainMedia?.image?.url ?? NO_IMAGE_PRODUCT_IMAGE,
      };
    },

    async getProductPreview(slug: string): Promise<ProductPreview> {
      const res = await products
        .queryProducts()
        .eq("slug", slug)
        .limit(1)
        .find();
      const p = res.items?.[0];

      const title = p?.name ?? "";
      const imageUrl =
        p?.media?.mainMedia?.image?.url ?? NO_IMAGE_PRODUCT_IMAGE;
      const price =
        p?.price?.formatted?.price ?? p?.priceData?.formatted?.price ?? "";

      return { title, price, imageUrl };
    },

    searchCategories: searchCategoriesV1,

    getCategory: getCategoryV1,
  };
}
