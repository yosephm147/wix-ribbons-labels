import React from "react";
import {
  Box,
  Dropdown,
  FormField,
  NumberInput,
  Text,
} from "@wix/design-system";
import {
  clampNewStatusDaysOld,
  getMaxNewStatusDaysOld,
} from "@/store/conditionRulesShared";
import { ConditionCard } from "./ConditionCard";
import { ConditionDivider, ConditionRow } from "./ConditionRow";
import type { ConditionHelpers } from "./useConditions";
import type {
  DiscountKind,
  InventoryStatusValue,
} from "@/extensions/dashboard/pages/types";

const DISCOUNT_KIND_OPTIONS: { id: DiscountKind; value: string }[] = [
  { id: "percent", value: "%" },
  { id: "amount", value: "$" },
];

// ─── Inventory status ─────────────────────────────────────────────────────────

const INVENTORY_OPTIONS: {
  id: InventoryStatusValue;
  value: string;
  dot: string;
}[] = [
  { id: "inStock", value: "In stock", dot: "#2E7D32" },
  { id: "outOfStock", value: "Out of stock", dot: "#C62828" },
  {
    id: "availableForPreorder",
    value: "Available for preorder",
    dot: "#FFA726",
  },
];

function InventoryStatusPicker({
  selected,
  onChange,
}: {
  selected: InventoryStatusValue[];
  onChange: (v: InventoryStatusValue[]) => void;
}) {
  return (
    <Box width="180px" direction="vertical" gap="SP1">
      {INVENTORY_OPTIONS.map(({ id, value, dot }) => {
        const active = selected.includes(id);
        return (
          <div
            key={id}
            onClick={() => {
              const set = new Set(selected);
              if (set.has(id)) set.delete(id);
              else set.add(id);
              onChange([...set] as InventoryStatusValue[]);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              borderRadius: "6px",
              cursor: "pointer",
              background: active ? "#EEF4FF" : "transparent",
              border: active ? "1px solid #C6D9FF" : "1px solid transparent",
              transition: "all 0.1s",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                flexShrink: 0,
                background: dot,
              }}
            />
            <Text size="small">{value}</Text>
          </div>
        );
      })}
    </Box>
  );
}

// ─── Advanced conditions card ─────────────────────────────────────────────────

export function AdvancedConditionsCard({
  helpers,
}: {
  helpers: ConditionHelpers;
}) {
  const { hasRule, getRule, updateRule, toggleRule } = helpers;

  const discountRule = getRule("discount");
  const inventoryRule = getRule("inventoryStatus");
  const inventoryQuantityRule = getRule("inventoryQuantity");
  const newStatusRule = getRule("newStatus");
  // const metafieldRule = getRule("metafield");

  const maxNewStatusDays = getMaxNewStatusDaysOld();
  const newStatusDaysRaw = newStatusRule?.daysOld;

  return (
    <ConditionCard title="Advanced">
      {/* Discounts */}
      <ConditionRow
        label="Discounts"
        description="Match products with an active discount"
        checked={hasRule("discount")}
        onToggle={() =>
          toggleRule("discount", {
            type: "discount",
            discountKind: "percent",
          })
        }
      >
        <Box direction="horizontal" gap="SP3" verticalAlign="bottom">
          <Box flex={"1 1 100%"}>
            <FormField label="Minimum discount">
              <NumberInput
                value={discountRule?.min ?? ""}
                min={1}
                max={discountRule?.discountKind === "percent" ? 100 : undefined}
                hideStepper
                placeholder={"e.g. 5"}
                onChange={(v) => {
                  if (!discountRule) return;
                  let value = v;
                  if (typeof v === "number" && v < 1) value = 1;
                  if (
                    typeof v === "number" &&
                    discountRule?.discountKind === "percent" &&
                    v > 100
                  )
                    value = 100;
                  updateRule({
                    type: "discount",
                    discountKind: discountRule.discountKind,
                    min: typeof value === "number" ? value : undefined,
                  });
                }}
              />
            </FormField>
          </Box>
          <Box flex="0 0 20%" width="unset">
            <FormField label=" ">
              <Dropdown
                options={DISCOUNT_KIND_OPTIONS}
                selectedId={discountRule?.discountKind ?? "percent"}
                onSelect={({ id }) => {
                  const next = id as DiscountKind;
                  if (!discountRule || next === discountRule.discountKind)
                    return;
                  updateRule({
                    type: "discount",
                    discountKind: next,
                    min:
                      next === "percent" &&
                      discountRule.min != null &&
                      discountRule.min > 100
                        ? 100
                        : discountRule.min,
                  });
                }}
                dropdownWidth="100%"
                popoverProps={{
                  dynamicWidth: true,
                }}
              />
            </FormField>
          </Box>
        </Box>
      </ConditionRow>
      <ConditionDivider />

      {/* Inventory status */}
      <ConditionRow
        label="Inventory status"
        description="Match products by their stock level"
        checked={hasRule("inventoryStatus")}
        onToggle={() =>
          toggleRule("inventoryStatus", {
            type: "inventoryStatus",
            values: ["inStock"],
          })
        }
      >
        <InventoryStatusPicker
          selected={inventoryRule?.values ?? ["inStock"]}
          onChange={(next) =>
            updateRule({ type: "inventoryStatus", values: next })
          }
        />
      </ConditionRow>
      <ConditionDivider />

      {/* Inventory quantity */}
      <ConditionRow
        label="Inventory quantity"
        description="Match products by stock quantity (min/max)"
        checked={hasRule("inventoryQuantity")}
        onToggle={() =>
          toggleRule("inventoryQuantity", {
            type: "inventoryQuantity",
            min: undefined,
            max: undefined,
          })
        }
      >
        <Box direction="horizontal" gap="SP3">
          <FormField label="Min quantity">
            <NumberInput
              value={inventoryQuantityRule?.min ?? ""}
              min={0}
              hideStepper
              placeholder="Any"
              onChange={(v) =>
                updateRule({
                  type: "inventoryQuantity",
                  min: v ?? undefined,
                  max: inventoryQuantityRule?.max,
                })
              }
            />
          </FormField>
          <FormField label="Max quantity">
            <NumberInput
              value={inventoryQuantityRule?.max ?? ""}
              min={0}
              hideStepper
              placeholder="Any"
              onChange={(v) =>
                updateRule({
                  type: "inventoryQuantity",
                  min: inventoryQuantityRule?.min,
                  max: v ?? undefined,
                })
              }
            />
          </FormField>
        </Box>
      </ConditionRow>
      <ConditionDivider />

      {/* New status */}
      <ConditionRow
        label="New status"
        description="Products added within N days ago"
        checked={hasRule("newStatus")}
        onToggle={() =>
          toggleRule("newStatus", { type: "newStatus", daysOld: 30 })
        }
      >
        <Box width="160px">
          <FormField label="Added within (days)">
            <NumberInput
              value={newStatusDaysRaw}
              min={1}
              max={maxNewStatusDays}
              hideStepper
              placeholder="30"
              onChange={(v) =>
                updateRule({
                  type: "newStatus",
                  daysOld: v == null ? undefined : clampNewStatusDaysOld(v),
                })
              }
            />
          </FormField>
        </Box>
      </ConditionRow>
      {/* <ConditionDivider /> */}

      {/* Metafields */}
      {/* <ConditionRow
        label="Metafields"
        description="Match products by a custom metafield key/value"
        checked={hasRule("metafield")}
        onToggle={() =>
          toggleRule("metafield", { type: "metafield", key: "", value: "" })
        }
      >
        <Box direction="horizontal" gap="SP3">
          <FormField label="Key">
            <Input
              value={metafieldRule?.key ?? ""}
              placeholder="e.g. custom.badge"
              onChange={(e) =>
                updateRule({
                  type: "metafield",
                  key: (e.target as HTMLInputElement).value,
                  value: metafieldRule?.value ?? "",
                })
              }
            />
          </FormField>
          <FormField label="Value">
            <Input
              value={metafieldRule?.value ?? ""}
              placeholder="e.g. featured"
              onChange={(e) =>
                updateRule({
                  type: "metafield",
                  key: metafieldRule?.key ?? "",
                  value: (e.target as HTMLInputElement).value,
                })
              }
            />
          </FormField>
        </Box>
      </ConditionRow> */}
    </ConditionCard>
  );
}
