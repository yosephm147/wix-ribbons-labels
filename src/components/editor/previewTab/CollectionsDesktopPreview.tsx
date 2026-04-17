import React, { useState, useEffect, useRef, type FC } from "react";
import { Box, Text } from "@wix/design-system";
import { SAMPLE_PRODUCTS, type PreviewProps } from "./previewShared";
import { CollectionCard } from "./CollectionCard";

// Switch from 3 → 2 cards when each card would be narrower than this.
const MIN_CARD_WIDTH = 140;
const GAP = 16;

const CollectionsDesktopPreview: FC<PreviewProps> = ({ settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardCount, setCardCount] = useState(2);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = (w: number) => {
      const fits2 = (w - GAP * 2) / 3 >= MIN_CARD_WIDTH;
      setCardCount(fits2 ? 2 : 1);
    };
    const ro = new ResizeObserver(([entry]) =>
      compute(entry.contentRect.width)
    );
    ro.observe(el);
    compute(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const products = SAMPLE_PRODUCTS.slice(0, cardCount);

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
        Products
      </Text>
      <div
        ref={containerRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cardCount}, 1fr)`,
          gap: GAP,
        }}
      >
        {products.map((p, i) => (
          <CollectionCard
            key={i}
            settings={settings}
            sizeKey="desktop_collection"
            title={p.title}
            price={p.price}
          />
        ))}
      </div>
    </Box>
  );
};

export default CollectionsDesktopPreview;
