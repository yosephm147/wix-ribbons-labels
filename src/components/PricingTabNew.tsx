import React, {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FC,
} from "react";
import { appPlans } from "@wix/app-management";
import { Box, Card, Text, Heading, Button } from "@wix/design-system";
import { Check } from "@wix/wix-ui-icons-common";

type BillingCycle = {
  cycleType?: "ONE_TIME" | "RECURRING";
  cycleDuration?: {
    unit?: "MONTH" | "YEAR";
    count?: number;
  };
};

type Discount = {
  totalPrice?: string;
  amount?: string;
  type?: string;
};

type PlanPrice = {
  totalPrice?: string;
  billingCycle?: BillingCycle;
  discount?: Discount;
};

type Plan = {
  _id?: string;
  name?: string;
  benefits?: string[];
  prices?: PlanPrice[];
};

const APP_ID_FOR_PRICING: string = "673c8932-0a2c-4fd1-a58e-bca432671c1b";

const formatBillingCycle = (billingCycle?: BillingCycle): string => {
  if (!billingCycle?.cycleType) {
    return "Billing cycle not specified";
  }
  if (billingCycle.cycleType === "ONE_TIME") {
    return "One-time";
  }
  const unit = billingCycle.cycleDuration?.unit?.toLowerCase() ?? "period";
  const count = billingCycle.cycleDuration?.count ?? 1;
  return `Recurring every ${count} ${unit}${count > 1 ? "s" : ""}`;
};

const formatPriceLine = (price: PlanPrice): string => {
  const totalPrice = price.totalPrice ?? "0.00";
  const recurringText = formatBillingCycle(price.billingCycle);

  if (price.discount?.totalPrice) {
    const discountType = price.discount.type
      ? ` (${price.discount.type.toLowerCase()})`
      : "";
    return `$${price.discount.totalPrice} (was $${totalPrice}) - ${recurringText}${discountType}`;
  }

  return `$${totalPrice} - ${recurringText}`;
};

const normalizeBenefits = (benefits: string[] | undefined): string[] => {
  if (!benefits) {
    return [];
  }
  return benefits
    .flatMap((benefit) => benefit.split("\n"))
    .map((benefit) => benefit.trim())
    .filter((benefit) => benefit.length > 0);
};

const mutedText = "#475467";
const strongText = "#101828";
const accent = "#155EEF";
const accentLight = "#EFF4FF";

const PricingTabNew: FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await appPlans.listAppPlansByAppId([
          APP_ID_FOR_PRICING,
        ]);
        const extractedPlans = (response.appPlans ?? []).flatMap(
          (appPlan) => appPlan.plans ?? []
        );
        if (!cancelled) {
          setPlans(extractedPlans as Plan[]);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Failed to load app plans."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasPlans = useMemo(() => plans.length > 0, [plans.length]);
  const description: Record<string, string> = {
    Free: "Ideal for users who want to try the app",
    Premium: "Designed for stores who want to raise sales",
  };

  if (error) {
    return (
      <Card>
        <Card.Header title="Pricing plans" />
        <Card.Content>
          <Text size="small" secondary>
            {error}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (!hasPlans) {
    return (
      <Card>
        <Card.Header title="Pricing plans" />
        <Card.Content>
          <Text size="small" secondary>
            No active plans were returned for this app ID.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Box direction="vertical" gap="SP6" paddingBottom="SP6">
      <Box
        direction="vertical"
        gap="SP2"
        align="center"
        width="60%"
        style={{
          alignSelf: "center",
          textAlign: "center",
        }}
      >
        <Heading size="extraLarge">Pricing plans</Heading>
        <Text size="small" secondary>
          Choose the plan that best fits your business needs. All options share
          the same setup quality with flexible billing cycles.
        </Text>
      </Box>
      <Box width="100%" direction="horizontal" gap="SP4" align="center">
        {plans.map((plan, index) => {
          const benefits = normalizeBenefits(plan.benefits);
          const prices = plan.prices ?? [];
          const primaryPrice = prices[0]?.totalPrice ?? "0.00";
          const isFeatured = plans.length > 1 && index === 1;

          return (
            <Box
              key={plan._id ?? plan.name}
              width="40%"
              style={{
                borderRadius: 28,
                background: "#FFFFFF",
              }}
            >
              <Card className="pricing-card">
                <Card.Content>
                  <Box
                    direction="vertical"
                    gap="SP4"
                    minHeight="510px"
                    paddingLeft="SP4"
                    paddingRight="SP4"
                    paddingTop="SP3"
                    paddingBottom="SP3"
                  >
                    <Box direction="vertical" gap="SP3">
                      <Box direction="vertical" gap="SP2">
                        <Heading size="extraLarge">
                          {plan.name ?? "Unnamed plan"}
                        </Heading>
                        <Text size="medium" secondary>
                          {description[plan.name ?? "Free"]}
                        </Text>
                      </Box>
                      <Box
                        style={{
                          marginTop: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <Box
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 4,
                          }}
                        >
                          <Heading size="extraLarge">$</Heading>
                          <Heading size="extraLarge" as="h1">
                            {primaryPrice}
                          </Heading>
                          <Text
                            size="small"
                            style={{
                              color: mutedText,
                              fontWeight: 500,
                              marginBottom: 8,
                            }}
                          >
                            /month
                          </Text>
                        </Box>
                      </Box>
                    </Box>

                    <Button
                      align="center"
                      width="100%"
                      onClick={() => {
                        console.log("Get started");
                      }}
                      style={{
                        minHeight: 48,
                        borderRadius: 10,
                        background: isFeatured ? accent : "#F8FAFC",
                        border: isFeatured
                          ? `1px solid ${accent}`
                          : "1px solid #D0D5DD",
                        color: isFeatured ? "#FFFFFF" : "#344054",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Get started
                    </Button>

                    <Box
                      direction="vertical"
                      gap="SP3"
                      style={{
                        marginTop: "auto",
                        paddingTop: 18,
                      }}
                    >
                      {benefits.length > 0 ? (
                        benefits.map((benefit) => (
                          <Box
                            key={benefit}
                            direction="horizontal"
                            gap="SP2"
                            verticalAlign="middle"
                          >
                            <Box
                              width="16px"
                              height="16px"
                              align="center"
                              verticalAlign="middle"
                              style={{
                                borderRadius: "999px",
                                background: accentLight,
                                border: `1px solid ${accent}`,
                                color: accent,
                                fontSize: 11,
                                fontWeight: 700,
                                lineHeight: 1,
                                marginTop: 3,
                                flexShrink: 0,
                              }}
                            >
                              <Check />
                            </Box>
                            <Text
                              size="small"
                              secondary
                              style={{ lineHeight: 1.6, color: "#344054" }}
                            >
                              {benefit}
                            </Text>
                          </Box>
                        ))
                      ) : (
                        <Text size="small" secondary>
                          No benefits listed.
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Card.Content>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PricingTabNew;
