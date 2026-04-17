import { Box } from "@wix/design-system";
import { ConditionDivider, MultiValueConditionRow } from "./ConditionRow";
import type { ConditionHelpers } from "./useConditions";
import { ConditionCard } from "./ConditionCard";

export function ScopeCard({ helpers }: { helpers: ConditionHelpers }) {
  return (
    <ConditionCard
      title="Scope (always applied)"
      description='These rules are always applied, regardless of "All" or "Any" conditions.'
    >
      <Box direction="vertical" gap="0">
        <MultiValueConditionRow
          label="Only include these categories"
          description="Limit to products in at least one of these categories"
          ruleType="categories"
          placeholder="Search categories…"
          helpers={helpers}
        />
        <ConditionDivider />
        <MultiValueConditionRow
          label="Always exclude these categories"
          description="Never show the badge on products in these categories"
          ruleType="excludeCategories"
          placeholder="Search categories…"
          helpers={helpers}
        />
        <ConditionDivider />
        <MultiValueConditionRow
          label="Always include these products"
          description="Always show the badge on these products"
          ruleType="includeProductSlugs"
          placeholder="Search products…"
          helpers={helpers}
        />
        <ConditionDivider />
        <MultiValueConditionRow
          label="Always exclude these products"
          description="Never show the badge on these products"
          ruleType="excludeProductSlugs"
          placeholder="Search products…"
          helpers={helpers}
        />
      </Box>
    </ConditionCard>
  );
}
