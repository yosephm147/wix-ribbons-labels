import { inventoryItemsV3 } from "@wix/stores";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import {
  normalizeV3ProductForEval,
  updateLabelIndexForProduct,
} from "../../../../utils/backendLabelEvaluation";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  getProductForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v3HandlersShared";

export default inventoryItemsV3.onInventoryItemUpdated(async (event) => {
  const modifiedFields = event.modifiedFields ?? {};
  const touchedInventory =
    Object.prototype.hasOwnProperty.call(modifiedFields, "quantity") ||
    Object.prototype.hasOwnProperty.call(
      modifiedFields,
      "availabilityStatus"
    );
  if (!touchedInventory) return;

  const productId = event.entity?.productId;
  if (!productId) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const product = await getProductForEvent(productId);
  if (!product) return;

  let normalized = normalizeV3ProductForEval(product);
  if (!normalized) return;

  normalized.inventoryTracked = event.entity.trackQuantity ?? null;
  normalized.inventoryQuantity = event.entity.quantity ?? null;

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
});
