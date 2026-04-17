import { productsV3 } from "@wix/stores";
import { embedLabelsConfigThenRecord } from "../../../../lib/embedLabelsAndRecordConfig";
import { recordLabelsConfigSnapshot } from "../../../../lib/labelsConfigSnapshot";
import { removeProductSlugFromLabelIndex } from "../../../../utils/backendLabelEvaluation";
import {
  getAppInstanceForEvent,
  getLabelsConfigForEvent,
  updateEmbeddedScriptForEvent,
} from "../webhooks/v3HandlersShared";

export default productsV3.onProductDeleted(async (event) => {
  const slug =
    typeof event.entity?.slug === "string" ? event.entity.slug : undefined;
  if (!slug) return;

  const config = await getLabelsConfigForEvent();
  if (!config || config.labels.length === 0) return;

  const nextConfig = removeProductSlugFromLabelIndex(slug, config);
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
