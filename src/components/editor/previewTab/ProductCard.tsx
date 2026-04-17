import React, { type FC } from "react";
import { Image } from "@wix/design-system";
import type { Label } from "@/extensions/dashboard/pages/types";
import {
  BadgeOverlay,
  PLACEHOLDER_IMAGE,
  ProductDetailsOutsideBadgeLayout,
  type SizeKey,
} from "./previewShared";

const QtySelector = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      border: "1px solid #d5d5d5",
      borderRadius: 4,
      overflow: "hidden",
      width: "fit-content",
    }}
  >
    {["-", "1", "+"].map((v, i) => (
      <div
        key={i}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#1a1a1a",
          borderRight: i < 2 ? "1px solid #d5d5d5" : undefined,
          fontWeight: v === "1" ? 400 : 600,
        }}
      >
        {v}
      </div>
    ))}
  </div>
);

const AddToCartButton: FC<{ fullWidth?: boolean }> = ({ fullWidth }) => (
  <div
    style={{
      backgroundColor: "#1a1a1a",
      color: "#fff",
      textAlign: "center",
      padding: "10px 0",
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.08em",
      width: fullWidth ? "100%" : undefined,
      boxSizing: "border-box",
    }}
  >
    ADD TO CART
  </div>
);

export const ProductCard: FC<{
  settings: Label;
  sizeKey: SizeKey;
  title?: string;
  price?: string;
  imageUrl?: string;
  layout?: "horizontal" | "vertical";
}> = ({
  settings,
  sizeKey,
  title = "Product name",
  price = "$10 USD (Product price)",
  imageUrl,
  layout = "horizontal",
}) => {
  const placement = settings.shapeSize.badgeImagePlacement ?? "inside";
  const badgeOutside = placement === "outside";
  const outsideSlot =
    settings.shapeSize.badgeOutsideSlot ?? "above_product_title";

  const titleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 22,
    color: "#1a1a1a",
    lineHeight: 1.2,
  };
  const priceStyle: React.CSSProperties = {
    fontSize: 14,
    color: "#4a4a4a",
  };

  if (layout === "vertical") {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Image with optional in-image badge */}
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            position: "relative",
            overflow: settings.shapeSize.overflowHidden ? "hidden" : "visible",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#f2f2f2",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // padding: "10%",
              boxSizing: "border-box",
            }}
          >
            <Image
              width="100%"
              height="100%"
              src={imageUrl || PLACEHOLDER_IMAGE}
              fit="cover"
              transparent={true}
            />
          </div>
          {!badgeOutside && (
            <BadgeOverlay settings={settings} sizeKey={sizeKey} />
          )}
        </div>

        {/* Details */}
        <div
          style={{
            padding: "16px 16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {badgeOutside ? (
            <ProductDetailsOutsideBadgeLayout
              slot={outsideSlot}
              title={title}
              price={price}
              titleStyle={titleStyle}
              priceStyle={priceStyle}
              settings={settings}
              sizeKey={sizeKey}
            />
          ) : (
            <>
              <div style={titleStyle}>{title}</div>
              <div style={priceStyle}>{price}</div>
            </>
          )}
          <QtySelector />
          <AddToCartButton fullWidth />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 32,
        alignItems: "flex-start",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* Left: image with optional in-image badge */}
      <div
        style={{
          width: "45%",
          position: "relative",
          overflow: settings.shapeSize.overflowHidden ? "hidden" : "visible",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            position: "relative",
            backgroundColor: "#f2f2f2",
            borderRadius: 8,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // padding: "10%",
            boxSizing: "border-box",
          }}
        >
          <Image
            width="100%"
            height="100%"
            src={imageUrl || PLACEHOLDER_IMAGE}
            fit="cover"
            transparent={true}
          />
          {!badgeOutside && (
            <BadgeOverlay settings={settings} sizeKey={sizeKey} />
          )}
        </div>
      </div>

      {/* Right: product details */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingTop: 8,
        }}
      >
        {badgeOutside ? (
          <ProductDetailsOutsideBadgeLayout
            slot={outsideSlot}
            title={title}
            price={price}
            titleStyle={titleStyle}
            priceStyle={priceStyle}
            settings={settings}
            sizeKey={sizeKey}
          />
        ) : (
          <>
            <div style={titleStyle}>{title}</div>
            <div style={priceStyle}>{price}</div>
          </>
        )}
        <QtySelector />
        <AddToCartButton />
      </div>
    </div>
  );
};

export default ProductCard;
