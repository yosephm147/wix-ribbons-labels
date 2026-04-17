import {
  LABEL_VARIABLE_IDS,
  type LabelVariableId,
  type LabelVariables,
} from "../extensions/dashboard/pages/types";
import type { NormalizedProduct } from "../store/types";

const VARIABLE_ID_SET = new Set<LabelVariableId>(
  LABEL_VARIABLE_IDS as readonly LabelVariableId[]
);

const VARIABLE_TOKEN_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

/** Placeholder values for dashboard badge preview only (not persisted). */
const PREVIEW_EXAMPLE_BY_ID: Record<LabelVariableId, string> = {
  sale_amt: "10",
  sale_pct: "20",
  inventory_quantity: "12",
  min_price: "29",
};

/**
 * Replaces `{{variable_id}}` tokens in label HTML with example values for editor preview.
 * Unknown tokens are left unchanged.
 */
export function applyLabelVariablePreviewExamples(html: string): string {
  if (!html) return html;
  return html.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (full, key: string) => {
    if (VARIABLE_ID_SET.has(key as LabelVariableId)) {
      return PREVIEW_EXAMPLE_BY_ID[key as LabelVariableId];
    }
    return full;
  });
}

export function extractVariableIds(message: string): LabelVariableId[] {
  if (!message) return [];
  const found = new Set<LabelVariableId>();
  VARIABLE_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null = VARIABLE_TOKEN_RE.exec(message);
  while (match) {
    const id = match[1];
    if (
      id &&
      VARIABLE_ID_SET.has(id as LabelVariableId) &&
      !found.has(id as LabelVariableId)
    ) {
      found.add(id as LabelVariableId);
    }
    match = VARIABLE_TOKEN_RE.exec(message);
  }
  return [...found];
}

export function computeLabelVariables(
  product: NormalizedProduct,
  requiredVarIds: LabelVariableId[]
): LabelVariables {
  if (requiredVarIds.length === 0) return {};
  const values: LabelVariables = {};

  for (const id of requiredVarIds) {
    if (id === "inventory_quantity") {
      if (product.inventoryQuantity != null) {
        values.inventory_quantity = product.inventoryQuantity;
      }
      continue;
    }

    if (id === "min_price") {
      if (product.price != null) {
        values.min_price = product.price;
      }
      continue;
    }

    if (id === "sale_amt" || id === "sale_pct") {
      const price = product.price;
      const compareAt = product.compareAtPrice;
      if (
        price == null ||
        compareAt == null ||
        !Number.isFinite(price) ||
        !Number.isFinite(compareAt) ||
        compareAt <= 0 ||
        compareAt <= price
      ) {
        continue;
      }

      const saleAmount = compareAt - price;
      if (id === "sale_amt") {
        values.sale_amt = Math.round(saleAmount);
      } else {
        const salePct = (saleAmount / compareAt) * 100;
        values.sale_pct = Math.min(Math.round(salePct), 99);
      }
    }
  }

  return values;
}
