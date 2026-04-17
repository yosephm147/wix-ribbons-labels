import React, { type FC } from "react";
import type {
  BadgeOutsideSlot,
  Label,
  MarginSettings,
} from "@/extensions/dashboard/pages/types";
import {
  marginsToCssPosition,
  outsideBadgeFlowBoxStyle,
  outsideBadgeJustifyContent,
} from "@/utils/marginSettings";
import { BadgeSvg } from "@/utils/badgeShape";
import type { ProductPreview } from "@/lib/storeSdk";

export const PLACEHOLDER_IMAGE = "/pants-with-padding.svg";
export { NO_IMAGE_PRODUCT_IMAGE } from "@/store/productImagePlaceholders";

export type SizeKey =
  | "desktop_collection"
  | "desktop_product"
  | "mobile_collection"
  | "mobile_product";

export type PreviewProps = {
  settings: Label;
  productPreview?: ProductPreview;
};

export const SAMPLE_PRODUCTS: ProductPreview[] = [
  { title: "Pants #1", price: "$20 USD" },
  { title: "Pants #2", price: "$11 USD" },
  { title: "Pants #3", price: "$36 USD" },
  { title: "Pants #4", price: "$45 USD" },
];

export const BadgeOverlay: FC<{
  settings: Label;
  sizeKey: SizeKey;
}> = ({ settings, sizeKey }) => {
  const size = settings.shapeSize[sizeKey];
  const margin = settings.shapeSize.margin ?? {
    top: "",
    right: "",
    bottom: "",
    left: "",
  };
  const posStyle = marginsToCssPosition(margin);

  const sizeStyle: React.CSSProperties =
    size.unit === "%"
      ? {
          width: `${size.width}%`,
          aspectRatio: `${size.width} / ${size.height}`,
        }
      : { width: size.width, height: size.height };

  return (
    <div
      style={{
        ...posStyle,
        ...sizeStyle,
        position: "absolute",
        minWidth: 24,
      }}
    >
      <BadgeSvg
        value={settings}
        width={size.unit === "%" ? "100%" : size.width}
        height={size.unit === "%" ? "100%" : size.height}
        renderedWidthHint={size.unit === "%" ? size.width : undefined}
        renderedHeightHint={size.unit === "%" ? size.height : undefined}
      />
    </div>
  );
};

const emptyMargin = (): MarginSettings => ({
  top: "",
  right: "",
  bottom: "",
  left: "",
});

/** Outside badges: document flow + flex left/center/right (matches embedded script, not absolute). */
export const OutsideBadgeInline: FC<{
  settings: Label;
  sizeKey: SizeKey;
  inline: boolean;
  /** When set with `inline`, parent supplies `justifyContent`; wrapper is shrink-to-fit (e.g. after title/price rows). */
  alignViaParent?: boolean;
}> = ({ settings, sizeKey, inline, alignViaParent }) => {
  const margin = settings.shapeSize.margin ?? emptyMargin();
  const justify = outsideBadgeJustifyContent(margin);
  const flowBox = outsideBadgeFlowBoxStyle(margin);
  const size = settings.shapeSize[sizeKey];
  const sizeStyle: React.CSSProperties =
    size.unit === "%"
      ? {
          width: `${size.width}%`,
          aspectRatio: `${size.width} / ${size.height}`,
        }
      : { width: size.width, height: size.height };

  if (inline && alignViaParent) {
    return (
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          boxSizing: "border-box",
          ...flowBox,
        }}
      >
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            ...sizeStyle,
            minWidth: 24,
          }}
        >
          <BadgeSvg
            value={settings}
            width={size.unit === "%" ? "100%" : size.width}
            height={size.unit === "%" ? "100%" : size.height}
            renderedWidthHint={size.unit === "%" ? size.width : undefined}
            renderedHeightHint={size.unit === "%" ? size.height : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: inline ? "inline-flex" : "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: justify,
        boxSizing: "border-box",
        width: inline ? "auto" : "100%",
        maxWidth: inline ? "100%" : undefined,
        minHeight: size.unit === "%" ? 48 : size.height,
        minWidth: inline ? 72 : undefined,
        verticalAlign: inline ? "middle" : undefined,
        ...flowBox,
      }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          ...sizeStyle,
          minWidth: 24,
        }}
      >
        <BadgeSvg
          value={settings}
          width={size.unit === "%" ? "100%" : size.width}
          height={size.unit === "%" ? "100%" : size.height}
          renderedWidthHint={size.unit === "%" ? size.width : undefined}
          renderedHeightHint={size.unit === "%" ? size.height : undefined}
        />
      </div>
    </div>
  );
};

/** Outside badge placement relative to title and price (editor preview). */
export const ProductDetailsOutsideBadgeLayout: FC<{
  slot: BadgeOutsideSlot;
  title: string;
  price: string;
  titleStyle: React.CSSProperties;
  priceStyle: React.CSSProperties;
  settings: Label;
  sizeKey: SizeKey;
}> = ({ slot, title, price, titleStyle, priceStyle, settings, sizeKey }) => {
  const B = ({ inline }: { inline: boolean }) => (
    <OutsideBadgeInline settings={settings} sizeKey={sizeKey} inline={inline} />
  );

  const justify = outsideBadgeJustifyContent(
    settings.shapeSize.margin ?? emptyMargin()
  );

  const titleEl = <div style={titleStyle}>{title}</div>;
  const priceEl = <div style={priceStyle}>{price}</div>;

  switch (slot) {
    case "above_product_title":
      return (
        <>
          <B inline={false} />
          {titleEl}
          {priceEl}
        </>
      );
    case "below_product_title":
      return (
        <>
          {titleEl}
          <B inline={false} />
          {priceEl}
        </>
      );
    case "before_product_title":
      return (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <B inline />
            <div style={{ ...titleStyle }}>{title}</div>
          </div>
          {priceEl}
        </>
      );
    case "after_product_title":
      return (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <div style={{ ...titleStyle, flex: "0 1 auto" }}>{title}</div>
            <div
              style={{
                flex: "1 1 120px",
                minWidth: 0,
                display: "flex",
                justifyContent: justify,
                alignItems: "center",
              }}
            >
              <OutsideBadgeInline
                settings={settings}
                sizeKey={sizeKey}
                inline
                alignViaParent
              />
            </div>
          </div>
          {priceEl}
        </>
      );
    case "above_product_price":
      return (
        <>
          {titleEl}
          <B inline={false} />
          {priceEl}
        </>
      );
    case "below_product_price":
      return (
        <>
          {titleEl}
          {priceEl}
          <B inline={false} />
        </>
      );
    case "before_product_price":
      return (
        <>
          {titleEl}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <B inline />
            <div style={{ ...priceStyle }}>{price}</div>
          </div>
        </>
      );
    case "after_product_price":
      return (
        <>
          {titleEl}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <div style={{ ...priceStyle, flex: "0 1 auto" }}>{price}</div>
            <div
              style={{
                flex: "1 1 80px",
                minWidth: 0,
                display: "flex",
                justifyContent: justify,
                alignItems: "center",
              }}
            >
              <OutsideBadgeInline
                settings={settings}
                sizeKey={sizeKey}
                inline
                alignViaParent
              />
            </div>
          </div>
        </>
      );
    default:
      return (
        <>
          <B inline={false} />
          {titleEl}
          {priceEl}
        </>
      );
  }
};
