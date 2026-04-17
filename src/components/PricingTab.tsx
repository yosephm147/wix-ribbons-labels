import React, { type FC } from "react";
import { Box, Button, Card, Text } from "@wix/design-system";
import { WIX_APP_MARKET_REVIEW_URL } from "@/constants/wixAppMarketReviewUrl";

const EARLY_ACCESS_FEATURES = [
  "Unlimited ribbons, badges, and labels",
  "Show ribbons and labels based on price, inventory, discounts, and more",
  "Display multiple ribbons and labels on a single product image",
  "Automatically show sale labels with discount percentages",
  "Full design control with ready-to-use styles",
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
            <Text size="medium" weight="bold">
              Everything unlocked during early access
            </Text>

            <Text size="small" secondary>
              You&apos;re getting the full product at no cost. As pricing rolls
              out, early access users will continue with the same level of
              access.
            </Text>

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
              <Button
                priority="secondary"
                onClick={() =>
                  window.open(
                    "https://powerupapps.com/",
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
          title="Everything unlocked during early access"
          subtitle="No tiers. No limits."
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
          title="Like the app? Leave a quick rating"
          subtitle="Takes 10 seconds and helps a lot."
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
