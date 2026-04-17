import { categories } from "@wix/categories";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import { applyCatalogScopeIdDeletedToLabelsConfig } from "../../../../utils/backendLabelEvaluation";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v3HandlersShared";

export default categories.onCategoryDeleted(async (event) => {
  const categoryId = event.metadata?.entityId;
  if (!categoryId) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const nextConfig = applyCatalogScopeIdDeletedToLabelsConfig(
    categoryId,
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
