import { products } from "@wix/stores";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import { applyCatalogScopeIdDeletedToLabelsConfig } from "../../../../utils/backendLabelEvaluation";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v1HandlersShared";

export default products.onProductCollectionDeleted(async (event) => {
  const collectionId = event.data?.collection_Id;
  if (!collectionId) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const nextConfig = applyCatalogScopeIdDeletedToLabelsConfig(
    collectionId,
    config
  );
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
