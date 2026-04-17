import React, { type FC, useEffect, useState } from "react";
import {
  Box,
  Card,
  Collapse,
  Dropdown,
  FormField,
  IconButton,
  Input,
  SegmentedToggle,
  Text,
} from "@wix/design-system";
import { ChevronDown, ChevronUp } from "@wix/wix-ui-icons-common";
import type {
  BadgeImagePlacement,
  BadgeOutsideSlot,
  Label,
  MarginSettings,
  OutsidePositionKey,
  PositionKey,
} from "@/extensions/dashboard/pages/types.ts";
import {
  BADGE_OUTSIDE_SLOT_OPTIONS,
  OUTSIDE_POSITION_OPTIONS,
  OUTSIDE_PREDEFINED_POSITION_MARGINS,
  PREDEFINED_POSITION_MARGINS,
  POSITION_OPTIONS,
} from "@/extensions/dashboard/pages/types";

const GRID: { id: PositionKey; gridColumn: number; gridRow: number }[] = [
  { id: "top-left", gridColumn: 1, gridRow: 1 },
  { id: "top-center", gridColumn: 2, gridRow: 1 },
  { id: "top-right", gridColumn: 3, gridRow: 1 },
  { id: "middle-left", gridColumn: 1, gridRow: 2 },
  { id: "center", gridColumn: 2, gridRow: 2 },
  { id: "middle-right", gridColumn: 3, gridRow: 2 },
  { id: "bottom-left", gridColumn: 1, gridRow: 3 },
  { id: "bottom-center", gridColumn: 2, gridRow: 3 },
  { id: "bottom-right", gridColumn: 3, gridRow: 3 },
];

const GRID_OUTSIDE: { id: OutsidePositionKey; gridColumn: number }[] = [
  { id: "left", gridColumn: 1 },
  { id: "middle", gridColumn: 2 },
  { id: "right", gridColumn: 3 },
];

/** Map middle row of inside grid to outside row for a sensible default when switching. */
const INSIDE_MIDDLE_TO_OUTSIDE: Partial<
  Record<PositionKey, OutsidePositionKey>
> = {
  "middle-left": "left",
  center: "middle",
  "middle-right": "right",
};

function getSquarePosition(pos: PositionKey): { top: string; left: string } {
  const near = "15px";
  const far = "calc(100% - 15px)";
  const mid = "50%";
  const map: Record<PositionKey, { top: string; left: string }> = {
    "top-left": { top: near, left: near },
    "top-center": { top: near, left: mid },
    "top-right": { top: near, left: far },
    "middle-left": { top: mid, left: near },
    center: { top: mid, left: mid },
    "middle-right": { top: mid, left: far },
    "bottom-left": { top: far, left: near },
    "bottom-center": { top: far, left: mid },
    "bottom-right": { top: far, left: far },
  };
  return map[pos];
}

function marginsMatch(a: MarginSettings, b: MarginSettings): boolean {
  return (
    a.top === b.top &&
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.left === b.left
  );
}

function getActivePosition(margin: MarginSettings): PositionKey | null {
  for (const key of POSITION_OPTIONS) {
    if (marginsMatch(margin, PREDEFINED_POSITION_MARGINS[key])) return key;
  }
  return null;
}

function getActiveOutsidePosition(
  margin: MarginSettings
): OutsidePositionKey | null {
  for (const key of OUTSIDE_POSITION_OPTIONS) {
    if (marginsMatch(margin, OUTSIDE_PREDEFINED_POSITION_MARGINS[key]))
      return key;
  }
  return null;
}

function outsideKeyFromInsidePosition(
  margin: MarginSettings
): OutsidePositionKey {
  const inside = getActivePosition(margin);
  if (inside && INSIDE_MIDDLE_TO_OUTSIDE[inside])
    return INSIDE_MIDDLE_TO_OUTSIDE[inside]!;
  return "left";
}

/** Only optional leading minus + digits; canonicalizes so 0001 → 1, -00001 → -1. */
const MARGIN_INPUT_PATTERN = /^-?\d*$/;

function marginFieldDisplay(
  margin: MarginSettings,
  key: keyof MarginSettings,
  minusOnly: boolean
): string {
  if (minusOnly) return "-";
  return margin[key];
}

export type PositionCardProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const PositionCard: FC<PositionCardProps> = ({ value, onChange }) => {
  const margin = value.shapeSize.margin ?? {
    top: "",
    right: "",
    bottom: "",
    left: "",
  };
  const placement: BadgeImagePlacement =
    value.shapeSize.badgeImagePlacement ?? "inside";
  const activePosition =
    placement === "inside" ? getActivePosition(margin) : null;
  const activeOutsidePosition =
    placement === "outside" ? getActiveOutsidePosition(margin) : null;

  const setMargin = (patch: Partial<MarginSettings>) => {
    onChange({
      ...value,
      shapeSize: {
        ...value.shapeSize,
        margin: { ...margin, ...patch },
      },
    });
  };

  const [open, setOpen] = useState(true);
  /** User typed "-" alone; margin stays "" until digits follow (text field canonicalizes 0001 → 1). */
  const [minusOnlyDraft, setMinusOnlyDraft] = useState<
    Partial<Record<keyof MarginSettings, boolean>>
  >({});

  useEffect(() => {
    setMinusOnlyDraft({});
  }, [value.id]);

  return (
    <Card>
      <Card.Header
        title="Position"
        suffix={
          <IconButton
            size="large"
            priority="tertiary"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        }
      />
      <Collapse open={open}>
        <Card.Divider />
        <Card.Content>
          <Box direction="vertical" gap="SP3">
            <FormField label="Badge placement">
              <SegmentedToggle
                size="small"
                selected={placement}
                onClick={(_e, v) => {
                  const next = v as BadgeImagePlacement;
                  if (next === "outside") {
                    const key = outsideKeyFromInsidePosition(margin);
                    setMinusOnlyDraft({});
                    onChange({
                      ...value,
                      shapeSize: {
                        ...value.shapeSize,
                        badgeImagePlacement: "outside",
                        badgeOutsideSlot:
                          value.shapeSize.badgeOutsideSlot ??
                          "above_product_title",
                        margin: {
                          ...OUTSIDE_PREDEFINED_POSITION_MARGINS[key],
                        },
                      },
                    });
                  } else {
                    onChange({
                      ...value,
                      shapeSize: {
                        ...value.shapeSize,
                        badgeImagePlacement: "inside",
                      },
                    });
                  }
                }}
              >
                <SegmentedToggle.Button value="inside">
                  Inside product image
                </SegmentedToggle.Button>
                <SegmentedToggle.Button value="outside">
                  Outside product image
                </SegmentedToggle.Button>
              </SegmentedToggle>
            </FormField>

            {placement === "outside" && (
              <FormField label="Position relative to title & price">
                <Dropdown
                  options={BADGE_OUTSIDE_SLOT_OPTIONS}
                  selectedId={
                    value.shapeSize.badgeOutsideSlot ?? "above_product_title"
                  }
                  onSelect={({ id }) =>
                    onChange({
                      ...value,
                      shapeSize: {
                        ...value.shapeSize,
                        badgeOutsideSlot: id as BadgeOutsideSlot,
                      },
                    })
                  }
                />
              </FormField>
            )}

            <Box direction="vertical" gap="SP2">
              <Text size="small" secondary>
                Predefined positions
              </Text>
              {placement === "inside" ? (
                <Box
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 56px)",
                    gridTemplateRows: "repeat(3, 56px)",
                    gap: 8,
                  }}
                  align="center"
                >
                  {GRID.map(({ id, gridColumn, gridRow }) => {
                    const dot = getSquarePosition(id);
                    const isSelected = activePosition === id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          setMinusOnlyDraft({});
                          onChange({
                            ...value,
                            shapeSize: {
                              ...value.shapeSize,
                              margin: { ...PREDEFINED_POSITION_MARGINS[id] },
                            },
                          });
                        }}
                        style={{
                          gridColumn,
                          gridRow,
                          position: "relative",
                          border: `2px solid ${
                            isSelected ? "#116dff" : "#e0e0e0"
                          }`,
                          borderRadius: 8,
                          backgroundColor: isSelected ? "#eef3ff" : "#f5f6f7",
                          cursor: "pointer",
                          width: 56,
                          height: 56,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: dot.top,
                            left: dot.left,
                            transform: "translate(-50%, -50%)",
                            borderRadius: 3,
                            backgroundColor: isSelected ? "#116dff" : "#b6c1cd",
                            width: 20,
                            height: 20,
                          }}
                        />
                      </div>
                    );
                  })}
                </Box>
              ) : (
                <Box
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 56px)",
                    gridTemplateRows: "56px",
                    gap: 8,
                  }}
                  align="center"
                >
                  {GRID_OUTSIDE.map(({ id, gridColumn }) => {
                    const dotKey =
                      id === "left"
                        ? "middle-left"
                        : id === "middle"
                        ? "center"
                        : "middle-right";
                    const dot = getSquarePosition(dotKey);
                    const isSelected = activeOutsidePosition === id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          setMinusOnlyDraft({});
                          onChange({
                            ...value,
                            shapeSize: {
                              ...value.shapeSize,
                              margin: {
                                ...OUTSIDE_PREDEFINED_POSITION_MARGINS[id],
                              },
                            },
                          });
                        }}
                        style={{
                          gridColumn,
                          gridRow: 1,
                          position: "relative",
                          border: `2px solid ${
                            isSelected ? "#116dff" : "#e0e0e0"
                          }`,
                          borderRadius: 8,
                          backgroundColor: isSelected ? "#eef3ff" : "#f5f6f7",
                          cursor: "pointer",
                          width: 56,
                          height: 56,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: dot.top,
                            left: dot.left,
                            transform: "translate(-50%, -50%)",
                            borderRadius: 3,
                            backgroundColor: isSelected ? "#116dff" : "#b6c1cd",
                            width: 20,
                            height: 20,
                          }}
                        />
                      </div>
                    );
                  })}
                </Box>
              )}
            </Box>
            <Text size="small" secondary>
              Margin
            </Text>
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {(
                [
                  { key: "top", label: "Top" },
                  { key: "bottom", label: "Bottom" },
                  { key: "left", label: "Left" },
                  { key: "right", label: "Right" },
                ] as { key: keyof MarginSettings; label: string }[]
              ).map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <Box direction="horizontal" gap="SP1" verticalAlign="middle">
                    <Input
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      value={marginFieldDisplay(
                        margin,
                        key,
                        minusOnlyDraft[key] === true
                      )}
                      onChange={(e) => {
                        const raw = (e.target as HTMLInputElement).value;
                        if (!MARGIN_INPUT_PATTERN.test(raw)) return;
                        if (raw === "") {
                          setMinusOnlyDraft((d) => ({
                            ...d,
                            [key]: undefined,
                          }));
                          setMargin({ [key]: "" });
                          return;
                        }
                        if (raw === "-") {
                          setMinusOnlyDraft((d) => ({ ...d, [key]: true }));
                          return;
                        }
                        setMinusOnlyDraft((d) => ({ ...d, [key]: undefined }));
                        const num = Number(raw);
                        if (!Number.isFinite(num)) return;
                        setMargin({ [key]: String(num) });
                      }}
                      onBlur={() => {
                        setMinusOnlyDraft((d) => ({ ...d, [key]: undefined }));
                      }}
                      suffix={
                        <Input.IconAffix>
                          <Text
                            align="center"
                            size="small"
                            style={{ verticalAlign: "middle" }}
                          >
                            px
                          </Text>
                        </Input.IconAffix>
                      }
                      size="small"
                      className="text-center"
                    />
                  </Box>
                </FormField>
              ))}
            </Box>
          </Box>
        </Card.Content>
      </Collapse>
    </Card>
  );
};

export default PositionCard;
