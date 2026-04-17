import React, { type FC } from "react";
import { Image } from "@wix/design-system";
import type { Label } from "@/extensions/dashboard/pages/types";
import {
  BadgeOverlay,
  PLACEHOLDER_IMAGE,
  ProductDetailsOutsideBadgeLayout,
  type SizeKey,
} from "./previewShared";

export const CollectionCard: FC<{
  settings: Label;
  sizeKey: SizeKey;
  title: string;
  price: string;
  imageUrl?: string;
}> = ({ settings, sizeKey, title, price, imageUrl }) => {
  const badgeOutside =
    (settings.shapeSize.badgeImagePlacement ?? "inside") === "outside";
  const outsideSlot =
    settings.shapeSize.badgeOutsideSlot ?? "above_product_title";

  const collectionTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  const collectionPriceStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#6b6b6b",
  };

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        // No overflow:hidden here — that would clip badges with negative margins.
        // Each inner section handles its own clipping/rounding.
        position: "relative",
      }}
    >
      {/* Positioning context for the badge — overflow controlled by settings */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          position: "relative",
          overflow: settings.shapeSize.overflowHidden ? "hidden" : "visible",
        }}
      >
        {/* Inner image layer — clips the image and rounds the top corners of the card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#f2f2f2",
            overflow: "hidden",
            borderRadius: "12px 12px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12%",
            boxSizing: "border-box",
          }}
        >
          <Image
            width="100%"
            height="100%"
            src={imageUrl || PLACEHOLDER_IMAGE}
            fit="contain"
            transparent={true}
          />
        </div>

        {!badgeOutside && (
          <BadgeOverlay settings={settings} sizeKey={sizeKey} />
        )}
      </div>

      <div
        style={{
          padding: "10px 12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: badgeOutside ? 8 : 0,
        }}
      >
        {badgeOutside ? (
          <ProductDetailsOutsideBadgeLayout
            slot={outsideSlot}
            title={title}
            price={price}
            titleStyle={{ ...collectionTitleStyle, marginBottom: 0 }}
            priceStyle={collectionPriceStyle}
            settings={settings}
            sizeKey={sizeKey}
          />
        ) : (
          <>
            <div style={collectionTitleStyle}>{title}</div>
            <div style={collectionPriceStyle}>{price}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default CollectionCard;
