import React, { type FC, useState } from "react";
import {
  Box,
  Card,
  Checkbox,
  Collapse,
  Dropdown,
  FormField,
  IconButton,
  Input,
  SegmentedToggle,
  Slider,
  Text,
} from "@wix/design-system";
import { ChevronDown, ChevronUp } from "@wix/wix-ui-icons-common";
import type { Label, ShapeSize } from "@/extensions/dashboard/pages/types";
import { SHAPE_DEFAULTS } from "@/utils/badgeShape";

type SizeSlotKey =
  | "desktop_collection"
  | "desktop_product"
  | "mobile_collection"
  | "mobile_product";

const SIZE_MODE_OPTIONS = [
  { id: "global", value: "Same size on all screens" },
  { id: "custom", value: "Custom size per screen" },
];

const PAGE_OPTIONS = [
  { id: "collection", value: "Collection page" },
  { id: "product", value: "Product page" },
];

function getActiveSlot(
  device: "desktop" | "mobile",
  page: "collection" | "product"
): SizeSlotKey {
  return `${device}_${page}` as SizeSlotKey;
}

function clampSizeByUnit(value: number, unit: "px" | "%"): number {
  if (unit === "%") {
    return value < 0 ? 0 : value > 100 ? 100 : value;
  }
  return value < 15 ? 15 : value > 200 ? 200 : value;
}

function getFallbackAspectRatio(shape: string): number {
  const defaults = SHAPE_DEFAULTS[shape] ?? { width: 64, height: 32 };
  if (defaults.width <= 0 || defaults.height <= 0) return 0.5;
  return defaults.height / defaults.width;
}

function updateAllSizes(
  settings: Label,
  updater: (s: ShapeSize) => ShapeSize
): Label {
  const shapeSize = { ...settings.shapeSize };

  (
    [
      "desktop_collection",
      "desktop_product",
      "mobile_collection",
      "mobile_product",
    ] as const
  ).forEach((key) => {
    shapeSize[key] = updater({ ...shapeSize[key] });
  });

  return { ...settings, shapeSize };
}

export type SizeCardProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const SizeCard: FC<SizeCardProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(true);
  const { shapeSize, text } = value;
  const { autoAdjust } = shapeSize;

  const isGlobal = shapeSize.shapeSizeMode === "global";

  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [page, setPage] = React.useState<"collection" | "product">(
    "collection"
  );

  const activeSlot = getActiveSlot(device, page);
  const activeSize = shapeSize[activeSlot];
  const sizeMin = activeSize.unit === "%" ? 0 : 15;
  const sizeMax = activeSize.unit === "%" ? 100 : 200;

  const deviceLabel = device === "desktop" ? "Desktop" : "Mobile";
  const pageLabel = page === "collection" ? "Collection page" : "Product page";

  const updateActiveSize = (updater: (s: ShapeSize) => ShapeSize) => {
    if (isGlobal) {
      onChange(updateAllSizes(value, updater));
    } else {
      const next = { ...value };
      next.shapeSize = { ...next.shapeSize };
      next.shapeSize[activeSlot] = updater({ ...next.shapeSize[activeSlot] });
      onChange(next);
    }
  };

  const updateWidth = (width: number) => {
    const formattedWidth = clampSizeByUnit(width, activeSize.unit);
    updateActiveSize((s) => {
      let newHeight = s.height;
      if (autoAdjust) {
        const aspectRatio =
          s.width > 0 && s.height > 0
            ? s.height / s.width
            : getFallbackAspectRatio(value.shape);
        newHeight = formattedWidth * aspectRatio;
      }
      return { ...s, width: formattedWidth, height: newHeight };
    });
  };

  const updateHeight = (height: number) =>
    updateActiveSize((s) => ({
      ...s,
      height: clampSizeByUnit(height, s.unit),
    }));

  const updateUnit = (unit: "px" | "%") =>
    updateActiveSize((s) => ({ ...s, unit }));

  return (
    <Card>
      <Card.Header
        title="Size"
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
          <Box direction="vertical" gap="SP5">
            {/* Shape Section */}
            <Box direction="vertical" gap="SP4">
              <Text weight="bold" size="small">
                Shape
              </Text>

              <FormField label="Size mode">
                <Dropdown
                  options={SIZE_MODE_OPTIONS}
                  selectedId={shapeSize.shapeSizeMode}
                  onSelect={({ id }) =>
                    onChange({
                      ...value,
                      shapeSize: {
                        ...value.shapeSize,
                        shapeSizeMode: id as "global" | "custom",
                      },
                    })
                  }
                />
              </FormField>

              {!isGlobal && (
                <>
                  <FormField label="Device">
                    <SegmentedToggle
                      selected={device}
                      onClick={(_e, v) => setDevice(v as "desktop" | "mobile")}
                    >
                      <SegmentedToggle.Button value="desktop">
                        Desktop
                      </SegmentedToggle.Button>

                      <SegmentedToggle.Button value="mobile">
                        Mobile
                      </SegmentedToggle.Button>
                    </SegmentedToggle>
                  </FormField>

                  <FormField label="Page">
                    <Dropdown
                      options={PAGE_OPTIONS}
                      selectedId={page}
                      onSelect={({ id }) =>
                        setPage(id as "collection" | "product")
                      }
                    />
                  </FormField>
                </>
              )}

              {/* Width */}
              <FormField
                label={
                  isGlobal ? "Width" : `Width (${deviceLabel} / ${pageLabel})`
                }
              >
                <Box direction="horizontal" gap="SP2">
                  <Slider
                    displayMarks={false}
                    min={sizeMin}
                    max={sizeMax}
                    value={activeSize.width}
                    onChange={(v) => {
                      updateWidth(typeof v === "number" ? v : v[0]);
                    }}
                  />

                  <Box direction="horizontal" gap="SP1" width="200px">
                    <Input
                      value={String(activeSize.width)}
                      onChange={(e) =>
                        updateWidth(
                          Number((e.target as HTMLInputElement).value) || 0
                        )
                      }
                      size="small"
                    />

                    <Dropdown
                      popoverProps={{ dynamicWidth: true, width: "unset" }}
                      options={[
                        { id: "px", value: "px" },
                        { id: "%", value: "%" },
                      ]}
                      selectedId={activeSize.unit}
                      onSelect={({ id }) => updateUnit(id as "px" | "%")}
                      size="small"
                    />
                  </Box>
                </Box>
              </FormField>

              {/* Height */}
              <FormField
                label={
                  isGlobal ? "Height" : `Height (${deviceLabel} / ${pageLabel})`
                }
              >
                <Box direction="horizontal" gap="SP2">
                  <Slider
                    displayMarks={false}
                    min={sizeMin}
                    max={sizeMax}
                    value={activeSize.height}
                    onChange={(v) =>
                      updateHeight(typeof v === "number" ? v : v[0])
                    }
                    disabled={autoAdjust}
                  />

                  <Box direction="horizontal" gap="SP1" width="200px">
                    <Input
                      value={String(activeSize.height)}
                      onChange={(e) =>
                        updateHeight(
                          Number((e.target as HTMLInputElement).value) || 0
                        )
                      }
                      size="small"
                      disabled={autoAdjust}
                    />

                    <Dropdown
                      popoverProps={{ dynamicWidth: true, width: "unset" }}
                      options={[
                        { id: "px", value: "px" },
                        { id: "%", value: "%" },
                      ]}
                      selectedId={activeSize.unit}
                      onSelect={({ id }) => updateUnit(id as "px" | "%")}
                      size="small"
                      disabled={autoAdjust}
                    />
                  </Box>
                </Box>
              </FormField>

              <Checkbox
                checked={autoAdjust}
                onChange={(e) =>
                  onChange({
                    ...value,
                    shapeSize: {
                      ...value.shapeSize,
                      autoAdjust: (e.target as HTMLInputElement).checked,
                    },
                  })
                }
              >
                Scale height with width
              </Checkbox>
            </Box>

            {/* Text Section */}
            <Box direction="vertical" gap="SP4">
              <Text weight="bold" size="small">
                Text
              </Text>

              <FormField label="Text size (% of badge height)">
                <Box direction="horizontal" gap="SP2" verticalAlign="middle">
                  <Box style={{ flex: 1 }}>
                    <Slider
                      displayMarks={false}
                      min={5}
                      max={100}
                      value={text.size}
                      onChange={(v) =>
                        onChange({
                          ...value,
                          text: {
                            ...value.text,
                            size: typeof v === "number" ? v : v[0],
                          },
                        })
                      }
                    />
                  </Box>
                  <Text size="small" secondary>
                    {text.size}%
                  </Text>
                </Box>
              </FormField>

              <FormField label="Space between letters">
                <Box direction="horizontal" gap="SP2">
                  <Slider
                    displayMarks={false}
                    min={0}
                    max={10}
                    value={text.letterSpacing}
                    onChange={(v) =>
                      onChange({
                        ...value,
                        text: {
                          ...value.text,
                          letterSpacing: typeof v === "number" ? v : v[0],
                        },
                      })
                    }
                  />

                  <Text size="small">{text.letterSpacing}px</Text>
                </Box>
              </FormField>
            </Box>
          </Box>
        </Card.Content>
      </Collapse>
    </Card>
  );
};

export default SizeCard;
