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

export default products.onProductCreated(async (event) => {
  const productId = event.data?.productId;
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
