import React, { type FC } from "react";
import { Box } from "@wix/design-system";
import { SAMPLE_PRODUCTS, type PreviewProps } from "./previewShared";
import { CollectionCard } from "./CollectionCard";
import { PhoneFrame } from "./PhoneFrame";

const CollectionsMobilePreview: FC<PreviewProps> = ({ settings }) => {
  return (
    <Box
      backgroundColor="D80"
      borderRadius="12px"
      border="1px solid #e5e5e5"
      padding="SP4"
      direction="vertical"
    >
      <PhoneFrame>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
            padding: 10,
          }}
        >
          {SAMPLE_PRODUCTS.map((p, i) => (
            <CollectionCard
              key={i}
              settings={settings}
              sizeKey="mobile_collection"
              title={p.title}
              price={p.price}
            />
          ))}
        </div>
      </PhoneFrame>
    </Box>
  );
};

export default CollectionsMobilePreview;
