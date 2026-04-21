import React, { type FC, useEffect, useState } from "react";
import { Box, Divider } from "@wix/design-system";
import type { Label, WeightUnit } from "@/extensions/dashboard/pages/types";
import { getStoreDefaultWeightUnit } from "@/lib/storeSdk";
import { useConditions } from "../productsTab/useConditions";
import { ApplyModeCard } from "../productsTab/ApplyModeCard";
import { SpecificProductsCard } from "../productsTab/SpecificProductsCard";
import { BasicConditionsCard } from "../productsTab/BasicConditionsCard";
import { AdvancedConditionsCard } from "../productsTab/AdvancedConditionsCard";
import { ScopeCard } from "../productsTab/ScopeCard";
import { ConditionsOperatorSection } from "../productsTab/ConditionsOperatorSection";
import { messageUsesAnyLabelVariable } from "@/utils/labelVariables";

export type ProductsTabProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const ProductsTab: FC<ProductsTabProps> = ({ value, onChange }) => {
  const helpers = useConditions(value, onChange);
  const applyMode = value.applyMode ?? "all";
  const hasLabelVariable = messageUsesAnyLabelVariable(
    value.text.message || ""
  );
  const [storeWeightUnit, setStoreWeightUnit] = useState<WeightUnit>("lbs");

  useEffect(() => {
    let cancelled = false;
    getStoreDefaultWeightUnit().then((u) => {
      if (!cancelled) setStoreWeightUnit(u);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasLabelVariable && applyMode === "all") {
      onChange({
        ...value,
        applyMode: "conditions",
      });
    }
  }, [applyMode, hasLabelVariable, onChange, value]);

  return (
    <Box direction="vertical" gap="SP4" width="100%">
      <ApplyModeCard
        value={value}
        onChange={onChange}
        disableAllMode={hasLabelVariable}
      />

      {applyMode === "specific" && (
        <SpecificProductsCard value={value} onChange={onChange} />
      )}

      <div
        aria-disabled={applyMode !== "conditions"}
        style={{
          opacity: applyMode !== "conditions" ? 0.5 : 1,
          pointerEvents: applyMode !== "conditions" ? "none" : "auto",
        }}
      >
        <Box direction="vertical" gap="SP4" width="100%">
          <ScopeCard helpers={helpers} />
          <ConditionsOperatorSection value={value} onChange={onChange} />
          <Divider />
          <BasicConditionsCard
            helpers={helpers}
            defaultWeightUnit={storeWeightUnit}
          />
          <AdvancedConditionsCard helpers={helpers} />
        </Box>
      </div>
    </Box>
  );
};

export default ProductsTab;
