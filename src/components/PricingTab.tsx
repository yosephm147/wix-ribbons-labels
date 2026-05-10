import React, { type FC } from "react";
import { Box, Button, Card, Text } from "@wix/design-system";
import { WIX_APP_MARKET_REVIEW_URL } from "@/constants/appInfo";

const EARLY_ACCESS_FEATURES = [
  "Unlimited ribbons, badges, and labels",
  "Rules based on discounts, inventory, products, and more",
  "Multiple labels on a single product image",
  "Automatic sale labels with discount percentages",
  "Full design customization and templates",
];

const PricingTab: FC = () => {
  return (
    <Box direction="vertical" gap="24px" paddingBottom="SP6">
      <Card>
        <Card.Content>
          <Box
            direction="vertical"
            gap="20px"
            padding="32px 28px"
            align="center"
            textAlign="center"
          >
            <Box direction="vertical" gap="10px">
              <Text size="medium" weight="bold">
                Unlock free early access
              </Text>

              <Text size="small" secondary>
                You&apos;re getting the full product at no cost during early
                access.
                <br />
                Leave a review during early access to keep the app free for
                life.
              </Text>
            </Box>

            <Box direction="horizontal" gap="12px">
              <Button
                onClick={() =>
                  window.open(
                    WIX_APP_MARKET_REVIEW_URL,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Leave a review
              </Button>
              <Button
                priority="secondary"
                onClick={() =>
                  window.open(
                    "https://powerupapps.com/wix-product-badges",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Explore features
              </Button>
            </Box>
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header
          className="wix-card-header"
          title="Everything included during early access"
          subtitle="Full access during early access."
        />
        <Card.Content>
          <Box direction="vertical" gap="12px" padding="4px 0 12px">
            {EARLY_ACCESS_FEATURES.map((line) => (
              <Box
                key={line}
                direction="horizontal"
                gap="12px"
                verticalAlign="top"
              >
                <Box
                  align="center"
                  verticalAlign="middle"
                  width="22px"
                  height="22px"
                  flexShrink={0}
                  style={{
                    borderRadius: "999px",
                    background: "#E8F5E9",
                    marginTop: 1,
                  }}
                >
                  <Text size="tiny" weight="bold">
                    ✓
                  </Text>
                </Box>
                <Text size="small" style={{ flex: 1 }}>
                  {line}
                </Text>
              </Box>
            ))}
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header
          className="wix-card-header"
          title="Want to keep free access?"
          subtitle="Leave a quick review during early access to keep the app free for life."
        />
        <Card.Content>
          <Box direction="vertical" gap="16px">
            <Box direction="horizontal" gap="12px">
              <Button
                onClick={() =>
                  window.open(
                    WIX_APP_MARKET_REVIEW_URL,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Rate on Wix App Market
              </Button>
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
};

export default PricingTab;
