import { catalogVersioning } from "@wix/stores";
import { createV1Adapter } from "./v1Adapter";
import { createV3Adapter } from "./v3Adapter";
import { noopStoreAdapter } from "./noopStoreAdapter";
import type { StoreAdapter } from "./storeAdapter";

export type CatalogVersion =
  | "V1_CATALOG"
  | "V3_CATALOG"
  | "STORES_NOT_INSTALLED"
  | undefined;

export async function getCatalogVersion(): Promise<CatalogVersion> {
  const res = await catalogVersioning.getCatalogVersion();
  return res.catalogVersion;
}

export async function getStoreAdapter(): Promise<StoreAdapter> {
  const version = await getCatalogVersion();
  if (version === "V1_CATALOG") return createV1Adapter();
  if (version === "V3_CATALOG") return createV3Adapter();
  return noopStoreAdapter;
}
