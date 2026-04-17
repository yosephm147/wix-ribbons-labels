import {
  type LabelsConfig,
  type LabelIndexEntryVars,
  LABEL_VARIABLE_IDS,
} from "../extensions/dashboard/pages/types";

const CONFIG_VERSION = 1;

const defaultLabelsConfig: LabelsConfig = {
  version: CONFIG_VERSION,
  labels: [],
  labelIndex: {},
  defaultLabelIds: [],
};

function isLabelsConfig(value: unknown): value is LabelsConfig {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    Array.isArray(o.labels) &&
    o.labels !== null &&
    typeof o.labelIndex === "object" &&
    o.labelIndex !== null &&
    Array.isArray(o.defaultLabelIds)
  );
}

function isLabelIndexEntryVars(value: unknown): value is LabelIndexEntryVars {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.productId !== "string" || !o.productId) return false;
  for (const [k, v] of Object.entries(o)) {
    if (k === "productId") continue;
    if (!(LABEL_VARIABLE_IDS as readonly string[]).includes(k)) return false;
    if (typeof v !== "number" && typeof v !== "string") return false;
  }
  return true;
}

/**
 * Parse the `labels` embedded script parameter into LabelsConfig.
 * Returns default config when param is missing or invalid.
 */
export function parseLabels(param?: string): LabelsConfig {
  if (param == null || param === "") return { ...defaultLabelsConfig };

  try {
    let parsed = JSON.parse(param.replace(/\\"/g, '"'));
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    if (!isLabelsConfig(parsed)) return { ...defaultLabelsConfig };

    const labels = parsed.labels;

    const labelIndex: Record<string, Record<string, LabelIndexEntryVars>> = {};
    if (parsed.labelIndex && typeof parsed.labelIndex === "object") {
      for (const [k, v] of Object.entries(parsed.labelIndex)) {
        if (!v || typeof v !== "object" || Array.isArray(v)) continue;
        const bySlug: Record<string, LabelIndexEntryVars> = {};
        for (const [slug, vars] of Object.entries(v)) {
          if (!slug) continue;
          if (isLabelIndexEntryVars(vars)) {
            bySlug[slug] = vars;
          }
        }
        labelIndex[k] = bySlug;
      }
    }

    const defaultLabelIds = Array.isArray(parsed.defaultLabelIds)
      ? (parsed.defaultLabelIds as string[]).filter(
          (x) => typeof x === "string"
        )
      : [];

    return {
      version: CONFIG_VERSION,
      labels,
      labelIndex,
      defaultLabelIds,
    };
  } catch (error) {
    console.error("Failed to parse labels:", error);
    return { ...defaultLabelsConfig };
  }
}

/**
 * Serialize LabelsConfig for the embedded script parameter.
 */
export function serializeLabels(config: LabelsConfig): string {
  return JSON.stringify(config);
}
