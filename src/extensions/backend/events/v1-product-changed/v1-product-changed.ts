import { products } from "@wix/stores";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import { updateLabelIndexForProduct } from "../../../../utils/backendLabelEvaluation";
import { normalizeProductV1 } from "../../../../store/adapters/v1Adapter";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  getProductForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v1HandlersShared";

/** V1 `onProductChanged` reports top-level field names; re-evaluate labels only for these. */
const V1_PRODUCT_CHANGED_FIELDS_FOR_LABELS = new Set([
  "collectionIds",
  "price",
  "weight",
  "discount",
]);

export default products.onProductChanged(async (event) => {
  const productId = event.data?.productId;
  const changedFields = event.data?.changedFields ?? [];
  const shouldReevaluate = changedFields.some((field) =>
    V1_PRODUCT_CHANGED_FIELDS_FOR_LABELS.has(field)
  );
  if (!shouldReevaluate) return;

  if (!productId) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const productResponse = await getProductForEvent(productId);
  const product = productResponse.product;
  if (!product) return;

  const normalized = normalizeProductV1(product);
  if (!normalized) return;

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
