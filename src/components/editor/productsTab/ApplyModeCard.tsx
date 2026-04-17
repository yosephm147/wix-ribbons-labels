import { Box, Card, Text } from "@wix/design-system";
import type { ApplyMode, Label } from "@/extensions/dashboard/pages/types";

const APPLY_MODE_OPTIONS: { mode: ApplyMode; label: string; hint: string }[] = [
  { mode: "all", label: "All products", hint: "Badge on every product" },
  {
    mode: "specific",
    label: "Specific products",
    hint: "Choose products manually",
  },
  {
    mode: "conditions",
    label: "Products matching conditions",
    hint: "Filter by rules",
  },
];

function ApplyModePicker({
  value,
  onChange,
}: {
  value: ApplyMode;
  onChange: (mode: ApplyMode) => void;
}) {
  return (
    <Box direction="vertical" gap="SP2">
      {APPLY_MODE_OPTIONS.map(({ mode, label, hint }) => {
        const active = value === mode;
        return (
          <div
            key={mode}
            role="button"
            tabIndex={0}
            onClick={() => onChange(mode)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(mode);
              }
            }}
            style={{
              flex: "1 1 0",
              minWidth: "140px",
              padding: "12px 16px",
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

export function ApplyModeCard({
  value,
  onChange,
}: {
  value: Label;
  onChange: (next: Label) => void;
}) {
  const applyMode: ApplyMode = value.applyMode ?? "all";

  const setApplyMode = (mode: ApplyMode) => {
    if (mode === applyMode) return;
    onChange({
      ...value,
      applyMode: mode,
      conditions: { operator: "AND", rules: [] },
    });
  };

  return (
    <Card>
      <Card.Header
        title="Apply badge to"
        subtitle="Choose which products display this badge"
      />
      <Card.Divider />
      <Card.Content>
        <ApplyModePicker value={applyMode} onChange={setApplyMode} />
      </Card.Content>
    </Card>
  );
}
