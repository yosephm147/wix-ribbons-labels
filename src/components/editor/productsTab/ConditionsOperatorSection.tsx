import { Box, Text } from "@wix/design-system";
import type { Label } from "@/extensions/dashboard/pages/types";
import { ConditionCard } from "./ConditionCard";

type Operator = "AND" | "OR";

const OPERATOR_OPTIONS: { op: Operator; label: string; hint: string }[] = [
  { op: "AND", label: "All conditions", hint: "Every rule must match" },
  { op: "OR", label: "Any condition", hint: "At least one rule matches" },
];

function OperatorPicker({
  value,
  onChange,
}: {
  value: Operator;
  onChange: (op: Operator) => void;
}) {
  return (
    <Box
      direction="horizontal"
      gap="SP3"
      paddingTop="SP3"
      paddingBottom="SP3"
      paddingLeft="SP4"
      paddingRight="SP4"
      backgroundColor="D80"
      borderRadius="8px"
    >
      {OPERATOR_OPTIONS.map(({ op, label, hint }) => {
        const active = value === op;
        return (
          <div
            key={op}
            role="button"
            tabIndex={0}
            onClick={() => onChange(op)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(op);
              }
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              background: active ? "#fff" : "transparent",
              border: `1.5px solid ${active ? "#116DFF" : "#dfe3eb"}`,
              boxShadow: active ? "0 1px 6px rgba(17,109,255,0.12)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Box direction="vertical" gap="SP0">
              <Text size="small" weight={active ? "bold" : "normal"}>
                {label}
              </Text>
              <Text secondary size="small">
                {hint}
              </Text>
            </Box>
          </div>
        );
      })}
    </Box>
  );
}

export function ConditionsOperatorSection({
  value,
  onChange,
}: {
  value: Label;
  onChange: (next: Label) => void;
}) {
  const setOperator = (operator: Operator) =>
    onChange({ ...value, conditions: { ...value.conditions, operator } });

  return (
    <ConditionCard title="Conditions" collapsable={false}>
      <OperatorPicker
        value={value.conditions.operator}
        onChange={setOperator}
      />
    </ConditionCard>
  );
}
