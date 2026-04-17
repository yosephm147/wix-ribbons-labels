import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  Collapse,
  Divider,
  Dropdown,
  FormField,
  NumberInput,
  Text,
} from "@wix/design-system";
import type { WeightUnit } from "@/extensions/dashboard/pages/types";
import { convertWeightBetweenUnits } from "@/utils/weightUnits";
import type { ConditionHelpers } from "./useConditions";
import { AsyncMultiSelect, type Option } from "./AsyncMultiSelect";
import {
  searchCategories,
  searchProductsByName,
  getProduct,
  getCategory,
} from "@/lib/storeSdk";

// ─── Divider between condition rows ──────────────────────────────────────────

export function ConditionDivider() {
  return (
    <Box paddingLeft="SP4" paddingRight="SP4" width="100%">
      <Divider />
    </Box>
  );
}

// ─── Base condition row ───────────────────────────────────────────────────────

export function ConditionRow({
  label,
  description,
  checked,
  onToggle,
  children,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Box
      direction="vertical"
      style={{
        borderLeft: `3px solid ${checked ? "#116DFF" : "transparent"}`,
        transition: "border-left-color 0.15s ease",
        background: checked ? "rgba(17,109,255,0.03)" : "transparent",
        borderRadius: "0 4px 4px 0",
      }}
    >
      <Box
        direction="horizontal"
        verticalAlign="middle"
        gap="SP3"
        paddingTop="SP2"
        paddingBottom="SP2"
        paddingLeft="SP3"
        paddingRight="SP3"
      >
        <Checkbox checked={checked} onChange={onToggle} />
        <Box direction="vertical" gap="SP0" flexGrow={1}>
          <Text size="small" weight={checked ? "bold" : "normal"}>
            {label}
          </Text>
          {description && (
            <Text secondary size="small">
              {description}
            </Text>
          )}
        </Box>
      </Box>
      {children && (
        <Collapse open={checked}>
          <Box
            paddingLeft="SP8"
            paddingRight="SP3"
            paddingBottom="SP3"
            direction="vertical"
            gap="SP3"
          >
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

// ─── Range condition row (price / weight) ─────────────────────────────────────

type RangeRuleType = "priceRange" | "weightRange";

const WEIGHT_UNIT_OPTIONS: { id: WeightUnit; value: string }[] = [
  { id: "lbs", value: "lbs" },
  { id: "kg", value: "kg" },
];

export function RangeConditionRow({
  label,
  description,
  ruleType,
  unit: defaultWeightUnit = "lbs",
  helpers,
}: {
  label: string;
  description?: string;
  ruleType: RangeRuleType;
  /** Default unit when enabling weight range. Ignored for price. */
  unit?: WeightUnit;
  helpers: ConditionHelpers;
}) {
  const { hasRule, getRule, updateRule, toggleRule } = helpers;
  const rule = getRule(ruleType);
  const isWeight = ruleType === "weightRange";
  const weightUnit: WeightUnit =
    (rule as { unit?: WeightUnit } | undefined)?.unit ?? defaultWeightUnit;

  return (
    <ConditionRow
      label={label}
      description={description}
      checked={hasRule(ruleType)}
      onToggle={() =>
        toggleRule(
          ruleType,
          isWeight
            ? { type: "weightRange", unit: defaultWeightUnit }
            : { type: ruleType }
        )
      }
    >
      <Box direction="horizontal" gap="SP3" verticalAlign="top">
        <Box flex={"1 1 100%"}>
          <FormField label="Min">
            <NumberInput
              value={rule?.min ?? ""}
              min={0}
              hideStepper
              placeholder="0"
              onChange={(v) =>
                updateRule(
                  isWeight
                    ? {
                        type: "weightRange",
                        min: v ?? undefined,
                        max: rule?.max,
                        unit: weightUnit,
                      }
                    : {
                        type: ruleType,
                        min: v ?? undefined,
                        max: rule?.max,
                      }
                )
              }
            />
          </FormField>
        </Box>
        <Box flex={"1 1 100%"}>
          <FormField label="Max">
            <NumberInput
              value={rule?.max ?? ""}
              min={0}
              hideStepper
              placeholder="Any"
              onChange={(v) =>
                updateRule(
                  isWeight
                    ? {
                        type: "weightRange",
                        min: rule?.min,
                        max: v ?? undefined,
                        unit: weightUnit,
                      }
                    : {
                        type: ruleType,
                        min: rule?.min,
                        max: v ?? undefined,
                      }
                )
              }
            />
          </FormField>
        </Box>
        {isWeight && (
          <Box>
            <FormField label="Unit">
              <Dropdown
                options={WEIGHT_UNIT_OPTIONS}
                selectedId={weightUnit}
                onSelect={({ id }) => {
                  const w = id as WeightUnit;
                  if (w === weightUnit || !rule) return;
                  let min = rule.min;
                  let max = rule.max;
                  if (typeof min === "number" && Number.isFinite(min)) {
                    min = convertWeightBetweenUnits(min, weightUnit, w);
                  }
                  if (typeof max === "number" && Number.isFinite(max)) {
                    max = convertWeightBetweenUnits(max, weightUnit, w);
                  }
                  updateRule({
                    type: "weightRange",
                    unit: w,
                    min,
                    max,
                  });
                }}
                dropdownWidth="100%"
                popoverProps={{
                  dynamicWidth: true,
                  width: "unset",
                  minWidth: "unset",
                }}
              />
            </FormField>
          </Box>
        )}
      </Box>
    </ConditionRow>
  );
}

// ─── Multi-value condition row (async categories / products from Wix Stores) ──

type ValuesRuleType =
  | "categories"
  | "excludeCategories"
  | "includeProductSlugs"
  | "excludeProductSlugs";

async function valuesToOptions(
  values: string[],
  getOne: (key: string) => Promise<Option>
): Promise<Option[]> {
  if (values.length === 0) return [];
  const items = await Promise.all(values.map(getOne));
  return items.map((p) => ({ id: p.id, label: p.label, slug: p.slug }));
}

export function MultiValueConditionRow({
  label,
  description,
  ruleType,
  placeholder,
  helpers,
}: {
  label: string;
  description?: string;
  ruleType: ValuesRuleType;
  placeholder: string;
  helpers: ConditionHelpers;
}) {
  const { hasRule, getRule, updateRule, toggleRule } = helpers;
  const rule = getRule(ruleType);
  const storedValues = rule?.values ?? [];
  const getOne = useMemo(
    () =>
      ruleType === "categories" || ruleType === "excludeCategories"
        ? getCategory
        : getProduct,
    [ruleType]
  );
  const [value, setValue] = useState<Option[]>([]);

  // Run once on mount: selection updates are handled optimistically in `onChange`.
  useEffect(() => {
    valuesToOptions(storedValues, getOne).then((options) => {
      setValue(options);
    });
  }, []);

  const fetchOptions = useMemo(
    () =>
      ruleType === "categories" || ruleType === "excludeCategories"
        ? searchCategories
        : searchProductsByName,
    [ruleType]
  );

  return (
    <ConditionRow
      label={label}
      description={description}
      checked={hasRule(ruleType)}
      onToggle={() => toggleRule(ruleType, { type: ruleType, values: [] })}
    >
      <AsyncMultiSelect
        value={value}
        onChange={(options) => {
          // Optimistic UI: update labels immediately on selection.
          setValue(options);
          updateRule({
            type: ruleType,
            values:
              ruleType === "categories" || ruleType === "excludeCategories"
                ? options.map((o) => o.id)
                : options.map((o) => o.slug),
          });
        }}
        fetchOptions={fetchOptions}
        placeholder={placeholder}
      />
    </ConditionRow>
  );
}
