import type { WeightUnit } from "@/extensions/dashboard/pages/types";
import { ConditionCard } from "./ConditionCard";
import { ConditionDivider, RangeConditionRow } from "./ConditionRow";
import type { ConditionHelpers } from "./useConditions";

export type BasicConditionsCardProps = {
  helpers: ConditionHelpers;
  /** From {@link getStoreDefaultWeightUnit}; defaults to lbs while loading. */
  defaultWeightUnit?: WeightUnit;
};
export function BasicConditionsCard(props: BasicConditionsCardProps) {
  const wu = props.defaultWeightUnit ?? "lbs";
  return (
    <ConditionCard title="Basic">
      <RangeConditionRow
        label="Price range"
        description="Filter by product selling price"
        ruleType="priceRange"
        helpers={props.helpers}
      />
      <ConditionDivider />
      <RangeConditionRow
        label="Weight range"
        description="Filter by product weight"
        ruleType="weightRange"
        unit={wu}
        helpers={props.helpers}
      />
    </ConditionCard>
  );
}
