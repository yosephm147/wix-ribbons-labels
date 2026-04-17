import type { WeightUnit } from "../extensions/dashboard/pages/types";

/** Kilograms per pound (exact definition). */
export const KG_PER_LB = 0.45359237;

/** Pounds per kilogram. */
export const LBS_PER_KG = 1 / KG_PER_LB;

export function parseStoreWeightUnit(unit: string | null): WeightUnit | null {
  if (!unit) return null;
  const u = unit.trim().toUpperCase();
  if (u === "KG") return "kg";
  if (u === "LB") return "lbs";
  return null;
}

/** Convert a weight value between lbs and kg. */
export function convertWeightBetweenUnits(
  value: number,
  from: WeightUnit,
  to: WeightUnit
): number {
  if (from === to) return value;
  if (from === "kg" && to === "lbs") return value * LBS_PER_KG;
  return value * KG_PER_LB;
}

/**
 * Express `product.weight` in the rule's unit using `product.weightUnit` when known.
 * If the store omits a unit, weight is assumed to be in kg (Wix catalog convention).
 */
export function productWeightInRuleUnit(
  weight: number | null,
  storeUnit: string | null,
  ruleUnit: WeightUnit
): number | null {
  if (weight == null || !Number.isFinite(weight)) return null;
  const pu = parseStoreWeightUnit(storeUnit) ?? "lbs";
  return convertWeightBetweenUnits(weight, pu, ruleUnit);
}

/** Convert rule min/max from `ruleUnit` to `catalogUnit` (e.g. V3 `shippingWeightRange` filter values). */
export function weightRangeBoundsInUnit(
  min: number | undefined,
  max: number | undefined,
  ruleUnit: WeightUnit,
  catalogUnit: WeightUnit
): { minBound?: number; maxBound?: number } {
  return {
    ...(min != null && Number.isFinite(min)
      ? {
          minBound: convertWeightBetweenUnits(min, ruleUnit, catalogUnit),
        }
      : {}),
    ...(max != null && Number.isFinite(max)
      ? {
          maxBound: convertWeightBetweenUnits(max, ruleUnit, catalogUnit),
        }
      : {}),
  };
}
