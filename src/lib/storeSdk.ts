import { inventoryItemsV3 } from "@wix/stores";
import {
  getCatalogVersion,
  getStoreAdapter,
} from "@/store/adapters/adapterFactory";
import { getCatalogDefaultWeightUnitV1 } from "@/store/adapters/v1Adapter";
import { getCatalogShippingWeightUnitV3 } from "@/store/adapters/v3Adapter";
import type { WeightUnit } from "@/extensions/dashboard/pages/types";
import type { ProductPreview, SearchOption } from "@/store/types";
export type { CatalogVersion } from "@/store/adapters/adapterFactory";
export type {
  NormalizedProduct,
  SearchOption,
  ProductPreview,
} from "@/store/types";

export async function searchCategories(input: string): Promise<SearchOption[]> {
  const adapter = await getStoreAdapter();
  return adapter.searchCategories(input);
}

export async function searchProductsByName(
  name: string
): Promise<SearchOption[]> {
  const adapter = await getStoreAdapter();
  return adapter.searchProductsByName(name);
}

export async function getProduct(slug: string): Promise<SearchOption> {
  const adapter = await getStoreAdapter();
  return adapter.getProduct(slug);
}

export async function getProductsBySlugs(
  slugs: string[]
): Promise<SearchOption[]> {
  const adapter = await getStoreAdapter();
  const products = await adapter.getProductsBySlugs(slugs);
  return products.map((p) => ({
    id: p.id,
    label: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
  }));
}

export async function getProductPreview(slug: string): Promise<ProductPreview> {
  const adapter = await getStoreAdapter();
  return adapter.getProductPreview(slug);
}

export async function getCategory(categoryId: string): Promise<SearchOption> {
  const adapter = await getStoreAdapter();
  return adapter.getCategory(categoryId);
}

/** Store catalog weight unit (lbs/kg) from the Wix Stores API — matches product weight in the catalog. */
export async function getStoreDefaultWeightUnit(): Promise<WeightUnit> {
  const version = await getCatalogVersion();
  if (version === "V3_CATALOG") return getCatalogShippingWeightUnitV3();
  if (version === "V1_CATALOG") return getCatalogDefaultWeightUnitV1();
  return "lbs";
}

export type InventoryItem = inventoryItemsV3.InventoryItem;
