import { NO_IMAGE_PRODUCT_IMAGE } from "../productImagePlaceholders";
import type {
  ConditionGroup,
  ConditionRule,
  InventoryStatusValue,
  WeightUnit,
} from "../../extensions/dashboard/pages/types";
import {
  parseStoreWeightUnit,
  weightRangeBoundsInUnit,
} from "../../utils/weightUnits";
import type {
  NormalizedProduct,
  ProductPreview,
  SearchOption,
} from "../types";
import {
  clampNewStatusDaysOld,
  conditionGroupNeedsProductInventory,
  splitConditionRulesForScope,
} from "../conditionRulesShared";
import { parseInventoryStatusV3 } from "../../utils/parseInventoryStatusV3";
import type { StoreAdapter } from "./storeAdapter";
import { inventoryItemsV3, productsV3 } from "@wix/stores";
import { categories } from "@wix/categories";

type V3Product = productsV3.V3Product;
type V3ProductSearch = productsV3.V3ProductSearch;
type V3InventoryItemQuery = inventoryItemsV3.InventoryItemQuery;

const SEARCH_PRODUCTS_PAGE_LIMIT = 20;
const INVENTORY_QUERY_PAGE_LIMIT = 100;
const INVENTORY_PRODUCT_ID_CHUNK = 100;
const CATEGORY_SEARCH_LIMIT = 20;

type V3ProductSearchFilter = productsV3.CommonSearchWithEntityContext["filter"];

type V3InventoryQueryFilter = NonNullable<V3InventoryItemQuery["filter"]>;

/** Resolved once per session from a sample product; V3 search filters use the store catalog weight unit. */
let cachedCatalogShippingWeightUnit: WeightUnit | undefined;

/** Catalog shipping weight unit from a sample product (cached). Used by the dashboard and storeSdk. */
export async function getCatalogShippingWeightUnitV3(): Promise<WeightUnit> {
  if (cachedCatalogShippingWeightUnit !== undefined) {
    return cachedCatalogShippingWeightUnit;
  }
  try {
    const res = await productsV3.queryProducts(
      { cursorPaging: { limit: 1 } },
      { fields: ["WEIGHT_MEASUREMENT_UNIT_INFO"] }
    );
    const raw =
      res.products?.[0]?.physicalProperties?.weightMeasurementUnitInfo
        ?.weightMeasurementUnit;
    const parsed = raw != null ? parseStoreWeightUnit(String(raw)) : null;
    cachedCatalogShippingWeightUnit = parsed ?? "kg";
  } catch {}
  return cachedCatalogShippingWeightUnit ?? "kg";
}

function isNonEmptyFilterClause(f: V3ProductSearchFilter): boolean {
  return Object.keys(f as object).length > 0;
}

function productSearchFilterForInventoryValue(
  v: InventoryStatusValue
): V3ProductSearchFilter {
  if (v === "availableForPreorder") {
    return {
      "inventory.preorderAvailability": {
        $in: ["ALL_VARIANTS", "SOME_VARIANTS"],
      },
    };
  }
  return {
    "inventory.availabilityStatus": {
      $in:
        v === "inStock"
          ? ["IN_STOCK", "PARTIALLY_OUT_OF_STOCK"]
          : ["OUT_OF_STOCK"],
    },
  };
}

function getProductFiltersV3(
  rules: ConditionGroup,
  catalogWeightUnit?: WeightUnit
): V3ProductSearchFilter {
  const { scopeRules, restRules } = splitConditionRulesForScope(rules.rules);

  const scopeClauses = scopeRules
    .map((r) => getProductFilterRuleV3(r, catalogWeightUnit))
    .filter(isNonEmptyFilterClause);

  const scopeFilter: V3ProductSearchFilter | null =
    scopeClauses.length === 0
      ? null
      : scopeClauses.length === 1
      ? scopeClauses[0]!
      : ({ $and: scopeClauses } as V3ProductSearchFilter);

  const operand = rules.operator === "AND" ? "$and" : "$or";
  const restClauses = restRules
    .map((r) => getProductFilterRuleV3(r, catalogWeightUnit))
    .filter(isNonEmptyFilterClause);

  const restFilter: V3ProductSearchFilter | null =
    restClauses.length === 0
      ? null
      : restClauses.length === 1
      ? restClauses[0]!
      : { [operand]: restClauses };

  if (!scopeFilter && !restFilter) return {};
  if (scopeFilter && !restFilter) return scopeFilter;
  if (!scopeFilter && restFilter) return restFilter;
  return { $and: [scopeFilter!, restFilter!] };
}

function getInventoryFilters(rules: ConditionGroup): V3InventoryQueryFilter {
  const operand = rules.operator === "AND" ? "$and" : "$or";
  const clauses = rules.rules
    .map(getInventoryV3FilterRule)
    .filter((c) => Object.keys(c as object).length > 0);

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0]!;
  return { [operand]: clauses } as V3InventoryQueryFilter;
}

function getProductFilterRuleV3(
  rule: ConditionRule,
  catalogWeightUnit?: WeightUnit
): V3ProductSearchFilter {
  switch (rule.type) {
    case "categories":
      return {
        "allCategoriesInfo.categories": {
          $matchItems: [{ _id: { $in: rule.values } }],
        },
      };
    case "excludeCategories":
      return {
        $not: {
          "allCategoriesInfo.categories": {
            $matchItems: [{ _id: { $in: rule.values } }],
          },
        },
      };
    case "priceRange":
      return {
        ...(rule.min
          ? { "actualPriceRange.minValue.amount": { $gte: String(rule.min) } }
          : {}),
        ...(rule.max
          ? { "actualPriceRange.maxValue.amount": { $lte: String(rule.max) } }
          : {}),
      };
    case "weightRange": {
      const { minBound, maxBound } = weightRangeBoundsInUnit(
        rule.min,
        rule.max,
        rule.unit ?? "lbs",
        catalogWeightUnit ?? "lbs"
      );
      return {
        ...(minBound != null
          ? {
              "physicalProperties.shippingWeightRange.minValue": {
                $gte: minBound,
              },
            }
          : {}),
        ...(maxBound != null
          ? {
              "physicalProperties.shippingWeightRange.maxValue": {
                $lte: maxBound,
              },
            }
          : {}),
      };
    }
    // Discount rules are not expressible on V3 product search; applied client-side
    // via `productMatchesDiscountRule` in evaluateLabels (same as V1 catalog path).
    case "discount":
      return {};
    case "inventoryStatus": {
      const vals = rule.values;
      if (vals.length === 0) return {};
      const clauses = vals
        .map(productSearchFilterForInventoryValue)
        .filter(isNonEmptyFilterClause);
      if (clauses.length === 0) return {};
      if (clauses.length === 1) return clauses[0]!;
      return { $or: clauses } as V3ProductSearchFilter;
    }
    case "newStatus": {
      if (rule.daysOld == null || !Number.isFinite(rule.daysOld)) return {};
      const days = clampNewStatusDaysOld(rule.daysOld);
      return {
        _createdDate: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      };
    }
    case "includeProductSlugs":
    case "excludeProductSlugs":
      return {};
    case "inventoryQuantity":
    case "productSlugs":
    case "metafield":
      return {};
    default:
      return {};
  }
}

/** Inventory-items query: only rules not expressible on product search (e.g. quantity). `inventoryStatus` is handled in `getProductFilterRuleV3`. */
function getInventoryV3FilterRule(rule: ConditionRule): V3InventoryQueryFilter {
  switch (rule.type) {
    case "inventoryQuantity": {
      const parts: V3InventoryQueryFilter[] = [];
      if (rule.min != null && Number.isFinite(rule.min)) {
        parts.push({ quantity: { $gte: rule.min } } as V3InventoryQueryFilter);
      }
      if (rule.max != null && Number.isFinite(rule.max)) {
        parts.push({ quantity: { $lte: rule.max } } as V3InventoryQueryFilter);
      }
      if (parts.length === 0) return {};
      if (parts.length === 1) return parts[0]!;
      return { $and: parts } as V3InventoryQueryFilter;
    }
    default:
      return {};
  }
}

export function applyInventoryV3ToNormalizedProduct(
  normalized: NormalizedProduct,
  items: inventoryItemsV3.InventoryItem[] | undefined | null
): NormalizedProduct {
  if (!items?.length) return normalized;

  const inventoryTracked = items.some((i) => i.trackQuantity === true);

  let quantitySum = 0;
  let counted = false;
  for (const item of items) {
    if (item.trackQuantity !== true) continue;
    const q = item.quantity;
    if (typeof q === "number" && Number.isFinite(q)) {
      quantitySum += q;
      counted = true;
    }
  }

  let sawInStock = false;
  let sawPreorder = false;
  for (const item of items) {
    const st = item.availabilityStatus;
    if (st === "IN_STOCK") {
      sawInStock = true;
    }
    if (st === "PREORDER") sawPreorder = true;
  }

  const inventoryStatus: InventoryStatusValue[] = sawInStock
    ? ["inStock"]
    : sawPreorder
    ? ["availableForPreorder"]
    : ["outOfStock"];

  return {
    ...normalized,
    inventoryStatus,
    inventoryQuantity: counted ? quantitySum : null,
    inventoryTracked,
  };
}

function normalizeProductV3(v3Product: V3Product): NormalizedProduct | null {
  if (!v3Product) return null;
  const id = v3Product._id;
  const name = v3Product.name ?? "";
  const slug = v3Product.slug ?? "";
  const imageUrl = v3Product.media?.main?.thumbnail?.url || undefined;
  if (typeof id !== "string" || !id) return null;

  const parseMoneyAmount = (
    value: string | undefined | null
  ): number | null => {
    if (value == null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const price =
    parseMoneyAmount(v3Product.actualPriceRange?.minValue?.amount) ??
    parseMoneyAmount(v3Product.actualPriceRange?.maxValue?.amount);

  const compareAtPrice =
    parseMoneyAmount(v3Product.compareAtPriceRange?.minValue?.amount) ??
    parseMoneyAmount(v3Product.compareAtPriceRange?.maxValue?.amount);

  const wr = v3Product.physicalProperties?.shippingWeightRange;
  let weight: number | null = null;
  if (wr?.minValue != null && Number.isFinite(wr.minValue)) {
    weight = wr.minValue;
  } else if (wr?.maxValue != null && Number.isFinite(wr.maxValue)) {
    weight = wr.maxValue;
  }

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
  const categoryIds = [...categoryIdsSet];

  const created =
    v3Product._createdDate instanceof Date &&
    !Number.isNaN(v3Product._createdDate.getTime())
      ? v3Product._createdDate
      : null;

  const inventoryStatus = parseInventoryStatusV3(v3Product);

  return {
    id,
    name,
    slug,
    imageUrl,
    categoryIds,
    price,
    compareAtPrice,
    weight,
    weightUnit,
    inventoryStatus,
    inventoryQuantity: null,
    inventoryTracked: true,
    createdAt: created,
  };
}

function normalizeProductsV3(
  products: productsV3.V3Product[] | undefined
): NormalizedProduct[] {
  const out: NormalizedProduct[] = [];
  for (const product of products ?? []) {
    const normalized = normalizeProductV3(product);
    if (normalized) out.push(normalized);
  }
  return out;
}

async function fetchAllQueryProductsBySlugIn(
  slugs: string[]
): Promise<V3Product[]> {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [];

  const filter = { slug: { $in: unique } } as V3ProductSearchFilter;
  const all: V3Product[] = [];
  let cursor: string | undefined;

  while (true) {
    const res = await productsV3.queryProducts({
      filter,
      cursorPaging: {
        limit: 100,
        ...(cursor ? { cursor } : {}),
      },
    });
    const page = res.products ?? [];
    all.push(...page);
    const hasNext = res.pagingMetadata?.hasNext === true;
    const next = res.pagingMetadata?.cursors?.next ?? undefined;
    if (!hasNext || !next || page.length === 0) break;
    cursor = next;
  }
  return all;
}

async function searchProductsV3(
  search?: Record<string, unknown>,
  rules?: ConditionGroup,
  allResults: boolean = false
): Promise<NormalizedProduct[]> {
  const needsCatalogWeight =
    rules && rules.rules.some((r) => r.type === "weightRange");
  const catalogWeightUnit: WeightUnit = needsCatalogWeight
    ? await getCatalogShippingWeightUnitV3()
    : "kg";
  const filter = rules
    ? getProductFiltersV3(rules, catalogWeightUnit)
    : undefined;

  const fetchProducts = (cursor?: string) =>
    productsV3.searchProducts({
      ...(search ?? {}),
      filter,
      cursorPaging: {
        limit: SEARCH_PRODUCTS_PAGE_LIMIT,
        ...(cursor ? { cursor } : {}),
      },
    } as V3ProductSearch);

  if (!allResults) {
    const res = await fetchProducts();
    return maybeMergeInventoryV3FromRules(
      normalizeProductsV3(res.products),
      rules
    );
  }

  const out: NormalizedProduct[] = [];
  let cursor: string | undefined;
  while (true) {
    const res = await fetchProducts(cursor);
    const page = res.products ?? [];
    out.push(...normalizeProductsV3(page));
    const next = res.pagingMetadata?.cursors?.next ?? undefined;
    const hasNext = res.pagingMetadata?.hasNext === true;
    if (!hasNext || !next || page.length === 0) break;
    cursor = next;
  }
  return maybeMergeInventoryV3FromRules(out, rules);
}

function buildInventoryItemsV3QueryFilter(
  productIds: string[],
  rules?: ConditionGroup
): NonNullable<V3InventoryItemQuery["filter"]> {
  const base = { productId: { $in: productIds } } as NonNullable<
    V3InventoryItemQuery["filter"]
  >;
  if (!rules) return base;
  const inv = getInventoryFilters(rules);
  if (Object.keys(inv as object).length === 0) return base;
  return { $and: [base, inv] } as NonNullable<V3InventoryItemQuery["filter"]>;
}

async function fetchInventoryV3ItemsByProductId(
  productIds: string[],
  rules?: ConditionGroup
): Promise<Record<string, inventoryItemsV3.InventoryItem[]>> {
  const out: Record<string, inventoryItemsV3.InventoryItem[]> = {};
  const unique = [...new Set(productIds.filter(Boolean))];
  for (let i = 0; i < unique.length; i += INVENTORY_PRODUCT_ID_CHUNK) {
    const chunk = unique.slice(i, i + INVENTORY_PRODUCT_ID_CHUNK);
    let cursor: string | undefined;
    let first = true;
    const filters = buildInventoryItemsV3QueryFilter(chunk, rules);
    while (true) {
      const res = first
        ? await inventoryItemsV3.queryInventoryItems({
            filter: filters,
            cursorPaging: { limit: INVENTORY_QUERY_PAGE_LIMIT },
          })
        : await inventoryItemsV3.queryInventoryItems({
            filter: filters,
            cursorPaging: {
              limit: INVENTORY_QUERY_PAGE_LIMIT,
              ...(cursor ? { cursor } : {}),
            },
          });
      first = false;
      const items = res.inventoryItems ?? [];
      for (const item of items) {
        const pid = item.productId;
        if (typeof pid !== "string" || !pid) continue;
        if (!out[pid]) out[pid] = [];
        out[pid].push(item);
      }
      const next = res.pagingMetadata?.cursors?.next ?? undefined;
      if (!next || items.length === 0) break;
      cursor = next;
    }
  }
  return out;
}

async function maybeMergeInventoryV3FromRules(
  products: NormalizedProduct[],
  rules: ConditionGroup | undefined
): Promise<NormalizedProduct[]> {
  if (
    !rules ||
    !conditionGroupNeedsProductInventory(rules, "v3") ||
    products.length === 0
  ) {
    return products;
  }
  const byProductId = await fetchInventoryV3ItemsByProductId(
    products.map((p) => p.id),
    rules
  );
  return products
    .filter((p) => p.id in byProductId)
    .map((p) => applyInventoryV3ToNormalizedProduct(p, byProductId[p.id]));
}

export function createV3Adapter(): StoreAdapter {
  return {
    async searchProducts(rules, allResults = false) {
      return searchProductsV3(undefined, rules, allResults);
    },

    async getProductsBySlugs(slugs: string[]) {
      const unique = [...new Set(slugs.filter(Boolean))];
      if (unique.length === 0) return [];

      const allItems = await fetchAllQueryProductsBySlugIn(unique);
      const normalized = allItems
        .map((p) => normalizeProductV3(p))
        .filter((p): p is NormalizedProduct => p != null);
      const bySlug = new Map(normalized.map((p) => [p.slug, p]));
      return unique
        .map((s) => bySlug.get(s))
        .filter((p): p is NormalizedProduct => p != null);
    },

    async searchProductsByName(name: string) {
      const trimmed = name?.trim();
      const items = await searchProductsV3(
        trimmed
          ? { search: { expression: trimmed, fields: ["name"] } }
          : undefined
      );
      return items.map((p) => ({
        id: p.id,
        label: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl ?? NO_IMAGE_PRODUCT_IMAGE,
      }));
    },

    async getProduct(slug: string) {
      const res = await productsV3.getProductBySlug(slug);
      const product = res.product;
      if (!product?._id) {
        throw new Error(`Product not found: ${slug}`);
      }
      return {
        id: product._id,
        label: product.name!,
        slug: product.slug!,
        imageUrl: product.media?.main?.thumbnail?.url ?? NO_IMAGE_PRODUCT_IMAGE,
      };
    },

    async getProductPreview(slug: string): Promise<ProductPreview> {
      let res: Awaited<ReturnType<typeof productsV3.getProductBySlug>>;
      try {
        res = await productsV3.getProductBySlug(slug);
      } catch {
        return { title: "", price: "", imageUrl: undefined };
      }
      const full = res.product;
      if (!full?._id) {
        return { title: "", price: "", imageUrl: undefined };
      }

      const p = full as unknown as {
        name?: string | null;
        slug?: string | null;
        media?: { main?: { thumbnail?: { url?: string | null } } };
        currency?: string | null;
        actualPriceRange?: {
          minValue?: { formattedAmount?: string | null; amount?: string };
        };
        variantsInfo?: { variants?: any[] };
      };

      const title = p?.name ?? "";
      const imageUrl = p?.media?.main?.thumbnail?.url ?? undefined;

      const formattedMinPrice = p?.actualPriceRange?.minValue?.formattedAmount;
      const minAmount = p?.actualPriceRange?.minValue?.amount;
      const currency = p?.currency ?? undefined;

      const variantPrice =
        p?.variantsInfo?.variants?.[0]?.physicalProperties?.pricePerUnit
          ?.description ??
        p?.variantsInfo?.variants?.[0]?.physicalProperties?.pricePerUnit
          ?.value ??
        "";

      const price =
        formattedMinPrice ||
        (minAmount && currency ? `${minAmount} ${currency}` : "") ||
        variantPrice;

      return { title, price, imageUrl };
    },

    async searchCategories(input: string): Promise<SearchOption[]> {
      const trimmed = input.trim();
      try {
        const response = await categories.searchCategories(
          {
            cursorPaging: { limit: CATEGORY_SEARCH_LIMIT },
            ...(trimmed
              ? {
                  search: {
                    expression: trimmed,
                    fields: ["name"],
                  },
                }
              : {}),
          },
          {
            returnNonVisibleCategories: true,
            treeReference: {
              appNamespace: "@wix/stores",
              treeKey: null,
            },
          }
        );
        const items = response.categories ?? [];
        return items
          .filter(
            (c): c is { _id: string; name: string; slug: string } =>
              typeof c._id === "string" &&
              !!c._id &&
              typeof c.slug === "string" &&
              !!c.slug &&
              typeof c.name === "string" &&
              !!c.name
          )
          .map((c) => ({ id: c._id, label: c.name, slug: c.slug }));
      } catch {
        return [];
      }
    },

    async getCategory(categoryId: string): Promise<SearchOption> {
      const category = await categories.getCategory(categoryId, {
        appNamespace: "@wix/stores",
        treeKey: null,
      });
      return { id: categoryId, label: category.name!, slug: category.slug! };
    },
  };
}
