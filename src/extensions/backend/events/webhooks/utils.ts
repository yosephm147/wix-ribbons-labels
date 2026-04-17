import { parseLabels } from "../../../../lib/labelsStorage";
import type { LabelsConfig } from "../../../dashboard/pages/types";

export async function getLabelsConfig(
  getEmbeddedScript: () => Promise<{
    parameters?: Record<string, string>;
  }>
): Promise<LabelsConfig | null> {
  try {
    const script = await getEmbeddedScript();
    const params = (script.parameters || {}) as Record<string, string>;
    const labelsParam = params.labels;
    if (labelsParam == null || labelsParam === "") {
      return null;
    }
    return parseLabels(labelsParam);
  } catch {
    return null;
  }
}
