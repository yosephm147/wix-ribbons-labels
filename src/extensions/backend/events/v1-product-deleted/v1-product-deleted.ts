import { products } from "@wix/stores";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import { removeProductFromLabelIndexByProductId } from "../../../../utils/backendLabelEvaluation";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v1HandlersShared";

export default products.onProductDeleted(async (event) => {
  const productId = event.data?.productId;
  if (!productId) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const nextConfig = removeProductFromLabelIndexByProductId(productId, config);
  if (!nextConfig) {
    return;
  }

  await embedLabelsConfigThenRecord(
    updateEmbeddedScriptForEvent,
    getAppInstanceForEvent,
    nextConfig,
    recordLabelsConfigSnapshot
  );
});
