import { productsV3 } from "@wix/stores";
import { appInstances, embeddedScripts } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { getLabelsConfig } from "./utils";

export const getEmbeddedScriptForEvent = auth.elevate(
  embeddedScripts.getEmbeddedScript
);
export const updateEmbeddedScriptForEvent = auth.elevate(
  embeddedScripts.embedScript
);
export const getAppInstanceForEvent = auth.elevate(appInstances.getAppInstance);
export const getProductForEvent = auth.elevate(productsV3.getProduct);

const NO_SCRIPT_LOG = "[ribbon] No embedded script on site (expected in wix dev)";

export function getLabelsConfigForEvent() {
  return getLabelsConfig(getEmbeddedScriptForEvent, NO_SCRIPT_LOG);
}
