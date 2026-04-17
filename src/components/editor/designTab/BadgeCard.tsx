import React, { type FC, useMemo, useState } from "react";
import {
  Box,
  Card,
  Checkbox,
  Collapse,
  ColorPicker,
  FormField,
  IconButton,
  Popover,
  Slider,
  Text,
} from "@wix/design-system";
import { ChevronDown, ChevronUp } from "@wix/wix-ui-icons-common";
import type { Label, ShapeSize } from "@/extensions/dashboard/pages/types";
import ShapePicker from "./ShapePicker";
import {
  SHAPE_DEFAULTS,
  BadgeShapePreview,
  getDefaultTextSizeForShape,
} from "@/utils/badgeShape";
import { applyLabelVariablePreviewExamples } from "@/utils/labelVariables";

export type BadgeCardProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const BadgeCard: FC<BadgeCardProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(true);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const bgColor = value.backgroundColor || "";
  const previewValue = useMemo(
    () => ({
      ...value,
      text: {
        ...value.text,
        message: applyLabelVariablePreviewExamples(value.text.message || ""),
      },
    }),
    [value]
  );

  return (
    <Card>
      <Card.Header
        title="Badge"
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
          <Box direction="vertical" gap="SP4">
            <Popover
              shown={bgPickerOpen}
              onClickOutside={() => setBgPickerOpen(false)}
              placement="bottom-start"
              appendTo="window"
            >
              <Popover.Element>
                <div
                  onClick={() => setBgPickerOpen((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                >
                  <Box direction="horizontal" verticalAlign="middle" gap="SP3">
                    <Box
                      width="36px"
                      height="36px"
                      borderRadius="50%"
                      flexShrink="0"
                      style={{
                        backgroundColor: bgColor || "transparent",
                        border: "1px solid #dfe3eb",
                      }}
                    />
                    <Box direction="vertical" gap="SP0">
                      <Text weight="bold" size="small">
                        Background color
                      </Text>
                      <Text secondary size="small">
                        {bgColor || "transparent"}
                      </Text>
                    </Box>
                  </Box>
                </div>
              </Popover.Element>
              <Popover.Content>
                <ColorPicker
                  value={bgColor || ""}
                  allowEmpty={true}
                  emptyPlaceholder="transparent"
                  onConfirm={(color: any) => {
                    onChange({
                      ...value,
                      backgroundColor: color
                        ? color.alpha?.() === 0
                          ? ""
                          : color.hex?.() ?? color
                        : "",
                    });
                    setBgPickerOpen(false);
                  }}
                />
              </Popover.Content>
            </Popover>
            <Box direction="vertical" gap="SP2">
              <Text size="small" secondary>
                Preview
              </Text>
              <Box
                align="left"
                verticalAlign="middle"
                backgroundColor="D80"
                borderRadius="4px"
                minHeight="100px"
              >
                <BadgeShapePreview
                  value={previewValue}
                  rotationOverride={value.shapeSize.rotation ?? 0}
                />
              </Box>
            </Box>
            <FormField label="Rotation">
              <Box direction="horizontal" gap="SP2" verticalAlign="middle">
                <Box style={{ flex: 1 }}>
                  <Slider
                    displayMarks={false}
                    min={0}
                    max={360}
                    value={value.shapeSize.rotation ?? 0}
                    onChange={(v) => {
                      const rot = typeof v === "number" ? v : v[0];
                      onChange({
                        ...value,
                        shapeSize: { ...value.shapeSize, rotation: rot },
                      });
                    }}
                  />
                </Box>
                <Text size="small" secondary>
                  {value.shapeSize.rotation ?? 0}°
                </Text>
              </Box>
            </FormField>
            <Checkbox
              checked={value.shapeSize?.overflowHidden ?? true}
              onChange={(e) =>
                onChange({
                  ...value,
                  shapeSize: {
                    ...value.shapeSize,
                    overflowHidden: (e.target as HTMLInputElement).checked,
                  },
                })
              }
            >
              Clip badge to image
            </Checkbox>
            <ShapePicker
              value={value.shape}
              onChange={(shape) => {
                const { width, height } = SHAPE_DEFAULTS[shape] ?? {
                  width: 64,
                  height: 32,
                };
                const makeSize = (w: number, h: number): ShapeSize => ({
                  width: w,
                  height: h,
                  unit: "px",
                });
                const shapeChanged = shape !== value.shape;
                onChange({
                  ...value,
                  shape,
                  ...(shapeChanged
                    ? {
                        text: {
                          ...value.text,
                          size: getDefaultTextSizeForShape(shape),
                        },
                      }
                    : {}),
                  shapeSize: {
                    ...value.shapeSize,
                    desktop_product: makeSize(width, height),
                    desktop_collection: makeSize(width, height),
                    mobile_product: makeSize(
                      // Math.round(width * 0.75),
                      // Math.round(height * 0.75)
                      width,
                      height
                    ),
                    mobile_collection: makeSize(
                      // Math.round(width * 0.75),
                      // Math.round(height * 0.75)
                      width,
                      height
                    ),
                  },
                });
              }}
            />
          </Box>
        </Card.Content>
      </Collapse>
    </Card>
  );
};

export default BadgeCard;
