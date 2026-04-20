import React, { useEffect, useMemo, useState, type FC } from "react";
import { appPlans } from "@wix/app-management";
import { Box, Card, Text } from "@wix/design-system";

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

const getGridColumns = (plansCount: number): string => {
  if (plansCount >= 3) {
    return "repeat(3, minmax(0, 1fr))";
  }

  if (plansCount === 2) {
    return "repeat(2, minmax(0, 1fr))";
  }

  return "minmax(0, 560px)";
};

const splitPriceParts = (
  totalPrice: string
): { whole: string; decimals: string } => {
  const [whole, decimals] = totalPrice.split(".");
  return {
    whole: whole && whole.length > 0 ? whole : "0",
    decimals: decimals ? `.${decimals}` : ".00",
  };
};

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

  if (isLoading) {
    return (
      <Card>
        <Card.Content>
          <Box padding="SP4">
            <Text size="small">Loading pricing plans...</Text>
          </Box>
        </Card.Content>
      </Card>
    );
  }

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
      <Box direction="vertical" gap="SP2">
        <Text
          size="tiny"
          style={{
            color: "#475467",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Plans
        </Text>
        <Text
          size="medium"
          weight="bold"
          style={{
            letterSpacing: "-0.02em",
            fontSize: 30,
            lineHeight: 1.15,
            color: "#101828",
          }}
        >
          Pricing plans
        </Text>
        <Text
          size="small"
          secondary
          style={{
            maxWidth: 720,
            lineHeight: 1.6,
            color: "#475467",
          }}
        >
          Choose the plan that best fits your business needs. All options share
          the same setup quality with flexible billing cycles.
        </Text>
      </Box>
      <Box
        width="100%"
        style={{
          display: "grid",
          gridTemplateColumns: getGridColumns(plans.length),
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        {plans.map((plan, index) => {
          const benefits = normalizeBenefits(plan.benefits);
          const prices = plan.prices ?? [];
          const primaryPrice = prices[0]?.totalPrice ?? "0.00";
          const primaryBilling = prices[0]?.billingCycle;
          const isFeatured = plans.length > 1 && index === 1;
          const priceParts = splitPriceParts(primaryPrice);

          return (
            <Box
              key={plan._id ?? plan.name ?? "plan"}
              width="100%"
              style={{
                borderRadius: 20,
                border: isFeatured ? "1px solid #B2DDFF" : "1px solid #E4E7EC",
                boxShadow: isFeatured
                  ? "0 18px 36px rgba(16, 24, 40, 0.14)"
                  : "0 8px 24px rgba(16, 24, 40, 0.08)",
                background: "#FFFFFF",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {isFeatured ? (
                <Box
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    zIndex: 1,
                    borderRadius: 999,
                    padding: "6px 12px",
                    background: "#EFF8FF",
                    border: "1px solid #B2DDFF",
                  }}
                >
                  <Text
                    size="tiny"
                    style={{
                      fontWeight: 700,
                      color: "#175CD3",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    Most popular
                  </Text>
                </Box>
              ) : null}
              <Card className="pricing-card">
                <Card.Content>
                  <Box
                    direction="vertical"
                    gap="SP5"
                    width="100%"
                    minHeight="600px"
                    padding="SP5"
                  >
                    <Box
                      direction="vertical"
                      gap="SP3"
                      style={{
                        paddingTop: 2,
                        paddingBottom: 2,
                      }}
                    >
                      <Box
                        style={{
                          alignSelf: "flex-start",
                          borderRadius: 999,
                          padding: "4px 12px",
                          background: isFeatured ? "#EFF8FF" : "#F8FAFC",
                          border: isFeatured
                            ? "1px solid #B2DDFF"
                            : "1px solid #EAECF0",
                        }}
                      >
                        <Text
                          size="tiny"
                          style={{
                            color: isFeatured ? "#175CD3" : "#475467",
                            fontWeight: 600,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          Plan
                        </Text>
                      </Box>
                      <Text
                        size="medium"
                        weight="bold"
                        style={{
                          fontSize: 28,
                          lineHeight: 1.2,
                          letterSpacing: "-0.02em",
                          color: "#101828",
                        }}
                      >
                        {plan.name ?? "Unnamed plan"}
                      </Text>
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
                          <Text
                            size="small"
                            style={{
                              color: "#344054",
                              fontSize: 22,
                              lineHeight: 1.25,
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            $
                          </Text>
                          <Text
                            size="medium"
                            weight="bold"
                            style={{
                              fontSize: 52,
                              lineHeight: 0.95,
                              letterSpacing: "-0.035em",
                              color: "#101828",
                            }}
                          >
                            {priceParts.whole}
                          </Text>
                          <Text
                            size="small"
                            style={{
                              color: "#344054",
                              fontSize: 22,
                              lineHeight: 1.25,
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            {priceParts.decimals}
                          </Text>
                          <Text
                            size="small"
                            style={{
                              color: "#475467",
                              fontWeight: 500,
                              marginBottom: 8,
                            }}
                          >
                            /mo
                          </Text>
                        </Box>
                        <Text
                          size="small"
                          secondary
                          style={{
                            display: "block",
                            color: "#475467",
                            lineHeight: 1.5,
                          }}
                        >
                          {formatBillingCycle(primaryBilling)}
                        </Text>
                      </Box>
                    </Box>

                    <Box
                      align="center"
                      verticalAlign="middle"
                      width="100%"
                      style={{
                        minHeight: 48,
                        borderRadius: 999,
                        background: isFeatured ? "#1570EF" : "#F8FAFC",
                        border: isFeatured ? "1px solid #1570EF" : "1px solid #D0D5DD",
                        color: isFeatured ? "#FFFFFF" : "#344054",
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: "0.01em",
                      }}
                    >
                      Choose {plan.name ?? "Plan"}
                    </Box>

                    <Box
                      direction="vertical"
                      gap="SP2"
                      style={{
                        padding: "18px 18px",
                        borderRadius: 14,
                        background: "#FCFCFD",
                        border: "1px solid #EAECF0",
                      }}
                    >
                      <Text
                        size="small"
                        weight="bold"
                        style={{
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Prices
                      </Text>
                      {prices.length > 0 ? (
                        prices.map((price, index) => (
                          <Text
                            key={`${
                              plan._id ?? plan.name ?? "plan"
                            }-price-${index}`}
                            size="small"
                            secondary
                            style={{
                              lineHeight: 1.5,
                            }}
                          >
                            {formatPriceLine(price)}
                          </Text>
                        ))
                      ) : (
                        <Text size="small" secondary>
                          No prices listed.
                        </Text>
                      )}
                    </Box>

                    <Box
                      direction="vertical"
                      gap="SP3"
                      style={{
                        marginTop: "auto",
                        paddingTop: 20,
                        borderTop: "1px solid #EAECF0",
                      }}
                    >
                      <Text
                        size="small"
                        weight="bold"
                        style={{
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Benefits
                      </Text>
                      {benefits.length > 0 ? (
                        benefits.map((benefit) => (
                          <Box
                            key={benefit}
                            direction="horizontal"
                            gap="SP2"
                            verticalAlign="top"
                          >
                            <Box
                              width="10px"
                              height="10px"
                              style={{
                                borderRadius: "999px",
                                background: "#98A2B3",
                                marginTop: 5,
                                flexShrink: 0,
                              }}
                            />
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
