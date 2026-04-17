import React, { type FC } from "react";
import type { Label } from "@/extensions/dashboard/pages/types";
import { labelFontCssStack } from "@/utils/labelFonts";

export const SHAPE_DEFAULTS: Record<string, { width: number; height: number }> =
  {
    rectangle: { width: 80, height: 32 },
    "rounded-rectangle": { width: 80, height: 32 },
    circle: { width: 56, height: 56 },
    starburst: { width: 64, height: 64 },
    "right-notch-flat": { width: 80, height: 32 },
    "left-notch-flat": { width: 80, height: 32 },
    "arrow-right": { width: 80, height: 32 },
    "arrow-left": { width: 80, height: 32 },
    "double-arrow": { width: 80, height: 32 },
    "diagonal-slash": { width: 100, height: 16 },
    "diagonal-slash-flipped": { width: 80, height: 16 },
    "diagonal-slash-round": { width: 100, height: 20 },
    "diagonal-slash-round-rotated": { width: 100, height: 20 },
    "corner-tr": { width: 56, height: 56 },
    "corner-tl": { width: 56, height: 56 },
    trapezoid: { width: 80, height: 32 },
    "trapezoid-inv": { width: 80, height: 32 },
    bowtie: { width: 80, height: 32 },
    "concave-right": { width: 80, height: 32 },
    "concave-left": { width: 80, height: 32 },
    hexagon: { width: 64, height: 56 },
    diamond: { width: 64, height: 64 },
    ribbon: { width: 80, height: 32 },
    "wide-chevron": { width: 80, height: 32 },
  };

/**
 * Editor default text size (% of badge height) per shape.
 * Placeholder values for non-rectangle/circle can be refined later.
 */
export const SHAPE_TEXT_SIZE_DEFAULTS: Record<string, number> = {
  rectangle: 40,
  circle: 20,
  "rounded-rectangle": 38,
  starburst: 22,
  "right-notch-flat": 34,
  "left-notch-flat": 34,
  "arrow-right": 34,
  "arrow-left": 34,
  "double-arrow": 32,
  "diagonal-slash": 50,
  "diagonal-slash-flipped": 50,
  "diagonal-slash-round": 50,
  "diagonal-slash-round-rotated": 50,
  "corner-tr": 24,
  "corner-tl": 24,
  trapezoid: 34,
  "trapezoid-inv": 34,
  bowtie: 30,
  "concave-right": 32,
  "concave-left": 32,
  hexagon: 26,
  diamond: 26,
  ribbon: 32,
  "wide-chevron": 32,
};

export function getDefaultTextSizeForShape(shape: string): number {
  return SHAPE_TEXT_SIZE_DEFAULTS[shape] ?? 20;
}

export const BADGE_TEXT_MAX_FONT_FRACTION_OF_VH = 0.85;

type ShapePathFn = (
  w: number,
  h: number,
  fill: string | undefined
) => React.ReactNode;

export const SHAPE_PATHS: Record<string, ShapePathFn> = {
  rectangle: (w, h, fill) => (
    <rect width={w} height={h} fill={fill} opacity={fill ? 1 : 0} />
  ),

  "rounded-rectangle": (w, h, fill) => {
    const r = Math.min(w, h) * 0.25;
    return (
      <rect
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  circle: (w, h, fill) => (
    <ellipse
      cx={w / 2}
      cy={h / 2}
      rx={w / 2}
      ry={h / 2}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  starburst: (w, h, fill) => {
    const cx = w / 2,
      cy = h / 2;
    const outerRx = w * 0.45;
    const outerRy = h * 0.45;
    const ctrlFactor = 1.25;
    const n = 16;
    const startAngle = -Math.PI / 2;
    let d = "";
    for (let i = 0; i < n; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / n;
      const x = cx + outerRx * Math.cos(angle);
      const y = cy + outerRy * Math.sin(angle);
      if (i === 0) d += `M${x.toFixed(2)},${y.toFixed(2)}`;
      const midAngle = startAngle + ((i + 0.5) * 2 * Math.PI) / n;
      const cpx = cx + outerRx * ctrlFactor * Math.cos(midAngle);
      const cpy = cy + outerRy * ctrlFactor * Math.sin(midAngle);
      const nextAngle = startAngle + ((i + 1) * 2 * Math.PI) / n;
      const nx = cx + outerRx * Math.cos(nextAngle);
      const ny = cy + outerRy * Math.sin(nextAngle);
      d += ` Q${cpx.toFixed(2)},${cpy.toFixed(2)} ${nx.toFixed(2)},${ny.toFixed(
        2
      )}`;
    }
    d += " Z";
    return <path d={d} fill={fill} opacity={fill ? 1 : 0} />;
  },

  "arrow-right": (w, h, fill) => {
    const tip = Math.min(h * 0.8, w * 0.25);
    return (
      <path
        d={`M 0,0 L ${w - tip},0 L ${w},${h / 2} L ${w - tip},${h} L 0,${h} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  "arrow-left": (w, h, fill) => {
    const tip = Math.min(h * 0.8, w * 0.25);
    return (
      <path
        d={`M ${tip},0 L ${w},0 L ${w},${h} L ${tip},${h} L 0,${h / 2} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  "double-arrow": (w, h, fill) => {
    const tip = Math.min(h * 0.8, w * 0.15);
    return (
      <path
        d={`M ${tip},0 L ${w - tip},0 L ${w},${h / 2} L ${
          w - tip
        },${h} L ${tip},${h} L 0,${h / 2} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  "right-notch-flat": (w, h, fill) => {
    const notch = h * 0.4;
    return (
      <path
        d={`M 0,0 L ${w},0 L ${w},${h} L 0,${h} L ${notch},${h / 2} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  "left-notch-flat": (w, h, fill) => {
    const notch = h * 0.4;
    return (
      <path
        d={`M 0,0 L ${w},0 L ${w - notch},${h / 2} L ${w},${h} L 0,${h} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // ShapePicker viewBox 40×28 path: M0,1 L40,29 L37,17 L12,0 — scaled to w×h

  "diagonal-slash": (w, h, fill) => (
    <path
      d={`M ${w * 0.15},0 L ${w * 0.85},0  L ${w},${h} L 0,${h} Z`}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  // ShapePicker viewBox 40×28 path: M40,28 L0,0 L3,12 L28,29 — scaled to w×h
  "diagonal-slash-flipped": (w, h, fill) => (
    <path
      d={`M 0,0 L ${w},0 L ${w * 0.85},${h} L ${w * 0.15},${h} Z`}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  // ShapePicker 40×28: shape occupies x:2–38, y:9–19 — normalize to fill w×h
  "diagonal-slash-round": (w, h, fill) => {
    const X = (n: number) => ((n - 2) / 36) * w;
    const Y = (n: number) => ((n - 9) / 10) * h;
    return (
      <path
        d={`M ${X(6.7)},${Y(11.1)} Q ${X(8)},${Y(9)} ${X(10.5)},${Y(9)} L ${X(
          35.5
        )},${Y(9)} Q ${X(38)},${Y(9)} ${X(36.7)},${Y(11.1)} L ${X(33.3)},${Y(
          16.9
        )} Q ${X(32)},${Y(19)} ${X(29.5)},${Y(19)} L ${X(4.5)},${Y(19)} Q ${X(
          2
        )},${Y(19)} ${X(3.3)},${Y(16.9)} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // ShapePicker 40×28: shape occupies x:2–38, y:9–19 — normalize to fill w×h
  "diagonal-slash-round-rotated": (w, h, fill) => {
    const X = (n: number) => ((n - 2) / 36) * w;
    const Y = (n: number) => ((n - 9) / 10) * h;
    return (
      <path
        d={`M ${X(33.3)},${Y(11.1)} Q ${X(32)},${Y(9)} ${X(29.5)},${Y(9)} L ${X(
          4.5
        )},${Y(9)} Q ${X(2)},${Y(9)} ${X(3.3)},${Y(11.1)} L ${X(6.7)},${Y(
          16.9
        )} Q ${X(8)},${Y(19)} ${X(10.5)},${Y(19)} L ${X(35.5)},${Y(19)} Q ${X(
          38
        )},${Y(19)} ${X(36.7)},${Y(16.9)} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // Top-right triangle (corner badge)
  "corner-tr": (w, h, fill) => (
    <path
      d={`M 0,0 L ${w},0 L ${w},${h} Z`}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  // Top-left triangle (corner badge)
  "corner-tl": (w, h, fill) => (
    <path
      d={`M 0,0 L 0,${h} L ${w},${h} Z`}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  // Wider top, narrower bottom
  trapezoid: (w, h, fill) => {
    const o = w * 0.1;
    return (
      <path
        d={`M ${o},0 L ${w - o},0 L ${w},${h} L 0,${h} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // Narrower top, wider bottom
  "trapezoid-inv": (w, h, fill) => {
    const o = w * 0.1;
    return (
      <path
        d={`M 0,0 L ${w},0 L ${w - o},${h} L ${o},${h} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // Both sides notched inward (bowtie/spool silhouette)
  bowtie: (w, h, fill) => {
    const m = w * 0.25;
    return (
      <path
        d={`M 0,0 L ${w},0 L ${w - m},${h / 2} L ${w},${h} L 0,${h} L ${m},${
          h / 2
        } Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // Right side concave, left side straight
  "concave-right": (w, h, fill) => {
    const c = w * 0.15;
    return (
      <path
        d={`M 0,0 L ${w},0 Q ${w - c},${h / 2} ${w},${h} L 0,${h} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  // Left side concave, right side straight
  "concave-left": (w, h, fill) => {
    const c = w * 0.15;
    return (
      <path
        d={`M 0,0 L ${w},0 L ${w},${h} L 0,${h} Q ${c},${h / 2} 0,0 Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  hexagon: (w, h, fill) => (
    <path
      d={`M ${w * 0.25},0 L ${w * 0.75},0 L ${w},${h / 2} L ${
        w * 0.75
      },${h} L ${w * 0.25},${h} L 0,${h / 2} Z`}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  diamond: (w, h, fill) => (
    <path
      d={`M ${w / 2},0 L ${w},${h / 2} L ${w / 2},${h} L 0,${h / 2} Z`}
      fill={fill}
      opacity={fill ? 1 : 0}
    />
  ),

  // Both sides concave (spool/ribbon shape)
  ribbon: (w, h, fill) => {
    const c = w * 0.15;
    return (
      <path
        d={`M 0,0 L ${w},0 Q ${w - c},${h / 2} ${w},${h} L 0,${h} Q ${c},${
          h / 2
        } 0,0 Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },

  "wide-chevron": (w, h, fill) => {
    const m = w * 0.15;
    return (
      <path
        d={`M 0,0 L ${w - m},0 L ${w},${h / 2} L ${
          w - m
        },${h} L 0,${h} L ${m},${h / 2} Z`}
        fill={fill}
        opacity={fill ? 1 : 0}
      />
    );
  },
};

// Per-shape overrides for text position and rotation angle (degrees)
export const TEXT_OVERRIDES: Record<
  string,
  {
    x: (w: number, h: number) => number;
    y: (w: number, h: number) => number;
    rotate: number;
  }
> = {
  "corner-tr": { x: (w) => w * 0.67, y: (_, h) => h * 0.33, rotate: 45 },
  "corner-tl": { x: (w) => w * 0.33, y: (_, h) => h * 0.67, rotate: 45 },
  "right-notch-flat": { x: (w) => w * 0.55, y: (_, h) => h * 0.5, rotate: 0 },
  "left-notch-flat": { x: (w) => w * 0.45, y: (_, h) => h * 0.5, rotate: 0 },
  "arrow-right": { x: (w) => w * 0.45, y: (_, h) => h * 0.5, rotate: 0 },
  "arrow-left": { x: (w) => w * 0.55, y: (_, h) => h * 0.5, rotate: 0 },
  "concave-left": { x: (w) => w * 0.52, y: (_, h) => h * 0.5, rotate: 0 },
  "concave-right": { x: (w) => w * 0.48, y: (_, h) => h * 0.5, rotate: 0 },
};

// ─── Shared SVG primitive ────────────────────────────────────────────────────
// All badge rendering goes through here. width/height control the display size
// (pixels for the design panel, "100%" for the card overlay); the viewBox is
// always the shape's natural coordinate space from SHAPE_DEFAULTS so paths and
// text are defined once and scale via SVG.

export type BadgeSvgProps = {
  value: Label;
  width: number | string;
  height: number | string;
  renderedWidthHint?: number;
  renderedHeightHint?: number;
  rotationOverride?: number;
  preserveAspectRatio?: string;
};

export const BadgeSvg: FC<BadgeSvgProps> = ({
  value,
  width,
  height,
  renderedWidthHint,
  renderedHeightHint,
  rotationOverride,
  preserveAspectRatio = "none",
}) => {
  const shape = value.shape || "rectangle";
  const defaults = SHAPE_DEFAULTS[shape] ?? { width: 64, height: 32 };
  const vw = defaults.width;
  const vh = defaults.height;

  const fill = value.backgroundColor || undefined;
  const renderPath = SHAPE_PATHS[shape];

  const rotation =
    rotationOverride !== undefined
      ? rotationOverride
      : value.shapeSize?.rotation ?? 0;

  const textOverride = TEXT_OVERRIDES[shape];
  const textX = textOverride ? textOverride.x(vw, vh) : vw / 2;
  const textY = textOverride ? textOverride.y(vw, vh) : vh / 2;
  const textRotate = textOverride ? textOverride.rotate : 0;
  const renderedWidth =
    typeof width === "number" ? width : renderedWidthHint ?? null;
  const renderedHeight =
    typeof height === "number" ? height : renderedHeightHint ?? null;
  const textScaleX =
    renderedWidth && renderedHeight && renderedWidth > 0 && renderedHeight > 0
      ? (renderedHeight * vw) / (renderedWidth * vh)
      : 1;
  const shouldCompensateTextStretch = Math.abs(textScaleX - 1) > 0.001;

  const labelRaw = value.text.message ?? "<b>SALE</b>";
  const isBold = labelRaw.includes("<b>");
  const isUnderline = labelRaw.includes("<u>");
  const isItalic = labelRaw.includes("<i>");
  const align = labelRaw.includes('style="text-align: left;"')
    ? "end"
    : labelRaw.includes('style="text-align: right;"')
    ? "start"
    : "middle";
  const label = labelRaw.replace(/<[^>]*>/g, "").trim();

  const textColor = value.text?.color || "#000000";
  // fontSize is in viewBox units — SVG scaling makes it appear correctly at any display size
  const fontSize =
    (vh * value.text.size * BADGE_TEXT_MAX_FONT_FRACTION_OF_VH) / 100;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio={preserveAspectRatio}
      style={{
        display: "block",
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
        overflow: "visible",
      }}
    >
      {renderPath ? (
        renderPath(vw, vh, fill)
      ) : (
        <rect width={vw} height={vh} fill={fill} />
      )}
      <text
        x={textX}
        y={textY}
        textAnchor={textOverride ? "middle" : align}
        dominantBaseline="central"
        fill={textColor}
        fontSize={`${fontSize}`}
        fontWeight={isBold ? "bold" : "normal"}
        textDecoration={isUnderline ? "underline" : "none"}
        fontStyle={isItalic ? "italic" : "normal"}
        fontFamily={labelFontCssStack(value.text?.font)}
        letterSpacing={value.text?.letterSpacing ?? 0}
        overflow="hidden"
        transform={
          [
            shouldCompensateTextStretch
              ? `translate(${textX} ${textY}) scale(${textScaleX} 1) translate(${-textX} ${-textY})`
              : "",
            textRotate !== 0 ? `rotate(${textRotate}, ${textX}, ${textY})` : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
      >
        {label}
      </text>
    </svg>
  );
};

// ─── Design-panel preview (fixed pixel size) ─────────────────────────────────

export type BadgeShapePreviewProps = {
  value: Label;
  rotationOverride?: number;
};

export const BadgeShapePreview: FC<BadgeShapePreviewProps> = ({
  value,
  rotationOverride,
}) => {
  const shape = value.shape || "rectangle";
  const defaults = SHAPE_DEFAULTS[shape] ?? { width: 64, height: 32 };
  const stored = value.shapeSize?.desktop_product;
  const scale = 1.5;
  const w =
    scale *
    (stored && stored.unit === "px" && stored.width > 0
      ? stored.width
      : defaults.width);
  const h =
    scale *
    (stored && stored.unit === "px" && stored.height > 0
      ? stored.height
      : defaults.height);

  return (
    <BadgeSvg
      value={value}
      width={w}
      height={h}
      rotationOverride={rotationOverride}
    />
  );
};
