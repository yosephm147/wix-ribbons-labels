import React, { type FC } from "react";
import { Box } from "@wix/design-system";
import { SAMPLE_PRODUCTS, type PreviewProps } from "./previewShared";
import { ProductCard } from "./ProductCard";
import { PhoneFrame } from "./PhoneFrame";

const ProductMobilePreview: FC<PreviewProps> = ({
  settings,
  productPreview,
}) => {
  const resolved = productPreview ?? SAMPLE_PRODUCTS[0];

  return (
    <Box
      backgroundColor="D80"
      borderRadius="12px"
      border="1px solid #e5e5e5"
      padding="SP4"
      direction="vertical"
    >
      <PhoneFrame>
        <ProductCard
          settings={settings}
          sizeKey="mobile_product"
          title={resolved.title}
          price={resolved.price}
          imageUrl={resolved.imageUrl}
          layout="vertical"
        />
      </PhoneFrame>
    </Box>
  );
};

export default ProductMobilePreview;
