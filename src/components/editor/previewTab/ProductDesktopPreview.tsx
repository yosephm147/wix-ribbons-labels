import React, { type FC } from "react";
import { Box, Text } from "@wix/design-system";
import { SAMPLE_PRODUCTS, type PreviewProps } from "./previewShared";
import { ProductCard } from "./ProductCard";

const ProductDesktopPreview: FC<PreviewProps> = ({
  settings,
  productPreview,
}) => {
  const resolved = productPreview ?? SAMPLE_PRODUCTS[0];

  return (
    <Box
      backgroundColor="D80"
      borderRadius="12px"
      border="1px solid #e5e5e5"
      padding="SP5"
      direction="vertical"
      gap="SP4"
      paddingRight="SP4"
      style={{ minHeight: 320 }}
    >
      <Text size="medium" weight="bold">
        Product Page
      </Text>
      <ProductCard
        settings={settings}
        sizeKey="desktop_product"
        title={resolved.title}
        price={resolved.price}
        imageUrl={resolved.imageUrl}
      />
    </Box>
  );
};

export default ProductDesktopPreview;
