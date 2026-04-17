import { productsV3 } from "@wix/stores";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import {
  normalizeV3ProductForEval,
  updateLabelIndexForProduct,
} from "../../../../utils/backendLabelEvaluation";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v3HandlersShared";

/** Re-evaluate labels when pricing or category-related fields change. */
const PRICE_FIELD_RE = /price/i;
const CATEGORY_FIELD_RE =
  /(?:^|\.)(?:directCategoryIdsInfo\.categoryIds|directCategoriesInfo\.categories|allCategoriesInfo\.categories|mainCategoryId)(?:\.|$)/i;

export default productsV3.onProductUpdated(async (event) => {
  const modifiedFields = event.modifiedFields ?? {};

  const shouldReevaluateLabels = Object.keys(modifiedFields).some(
    (fieldPath) =>
      PRICE_FIELD_RE.test(fieldPath) || CATEGORY_FIELD_RE.test(fieldPath)
  );
  if (!shouldReevaluateLabels) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  let normalized = normalizeV3ProductForEval(event.entity);
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
