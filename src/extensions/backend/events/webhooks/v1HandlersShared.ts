import { products, inventory } from "@wix/stores";
import { appInstances, embeddedScripts } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import { updateLabelIndexForProduct } from "../../../../utils/backendLabelEvaluation";
import {
  applyInventoryV1ToNormalizedProduct,
  normalizeProductV1,
} from "../../../../store/adapters/v1Adapter";
import { getLabelsConfig } from "./utils";

export const getEmbeddedScriptForEvent = auth.elevate(
  embeddedScripts.getEmbeddedScript
);
export const updateEmbeddedScriptForEvent = auth.elevate(
  embeddedScripts.embedScript
);
export const getAppInstanceForEvent = auth.elevate(appInstances.getAppInstance);
export const getProductForEvent = auth.elevate(products.getProduct);
export const getInventoryVariantsForEvent = auth.elevate(
  inventory.getInventoryVariants
);

const NO_SCRIPT_LOG = "[ribbon] No embedded script on site (expected in wix dev)";

export function getLabelsConfigForEvent() {
  return getLabelsConfig(getEmbeddedScriptForEvent, NO_SCRIPT_LOG);
}

/** True when any variant’s quantity, inStock, or availableForPreorder changed. */
export function inventoryVariantsEventHasInventoryDiff(
  event: inventory.InventoryVariantsChangedEnvelope
): boolean {
  const variants = event.data?.variants;
  if (!variants?.length) return false;
  for (const v of variants) {
    if (
      v.oldValue?.quantity !== v.newValue?.quantity ||
      v.oldValue?.inStock !== v.newValue?.inStock ||
      v.oldValue?.availableForPreorder !== v.newValue?.availableForPreorder
    ) {
      return true;
    }
  }
  return false;
}

export async function reevaluateLabelsForV1InventoryItem(
  productId: string,
  inventoryItemId: string
): Promise<void> {
  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const productResponse = await getProductForEvent(productId);
  const product = productResponse.product;
  if (!product) return;

  let normalized = normalizeProductV1(product);
  if (!normalized) return;

  const invResponse = await getInventoryVariantsForEvent(inventoryItemId, {
    productId,
  });
  const inventoryItem = invResponse.inventoryItem;
  if (!inventoryItem) return;

  normalized = applyInventoryV1ToNormalizedProduct(normalized, [inventoryItem]);

  const updatedConfig = updateLabelIndexForProduct(normalized, config);
  if (updatedConfig === config) {
    return;
  }

  await embedLabelsConfigThenRecord(
    updateEmbeddedScriptForEvent,
    getAppInstanceForEvent,
    updatedConfig,
    recordLabelsConfigSnapshot
  );
}
