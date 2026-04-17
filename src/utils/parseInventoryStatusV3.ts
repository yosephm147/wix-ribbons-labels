import { productsV3 } from "@wix/stores";
import type { InventoryStatusValue } from "../extensions/dashboard/pages/types";
import type { NormalizedProduct } from "../store/types";

export function parseInventoryStatusV3(
  v3Product: productsV3.V3Product
): NormalizedProduct["inventoryStatus"] {
  const statuses: InventoryStatusValue[] = [];
  switch (v3Product.inventory?.availabilityStatus) {
    case "IN_STOCK":
    case "PARTIALLY_OUT_OF_STOCK":
      statuses.push("inStock");
      break;
    case "OUT_OF_STOCK":
      statuses.push("outOfStock");
      break;
  }
  const preorderAvailability = v3Product.inventory?.preorderAvailability;
  const preorderStatus = v3Product.inventory?.preorderStatus;
  const isPreorderEnabled =
    preorderStatus === "ENABLED" || preorderStatus === "PARTIALLY_ENABLED";
  const hasPreorderAvailability =
    preorderAvailability === "ALL_VARIANTS" ||
    preorderAvailability === "SOME_VARIANTS";
  if (hasPreorderAvailability && isPreorderEnabled) {
    statuses.push("availableForPreorder");
  }
  return statuses.length > 0 ? statuses : null;
}
