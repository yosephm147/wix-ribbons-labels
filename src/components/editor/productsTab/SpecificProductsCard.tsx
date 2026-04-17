import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@wix/design-system";
import { searchProductsByName, getProductsBySlugs } from "@/lib/storeSdk";
import type { Label } from "@/extensions/dashboard/pages/types";
import { useConditions } from "./useConditions";
import { AsyncMultiSelect, type Option } from "./AsyncMultiSelect";

export type SpecificProductsCardProps = {
  value: Label;
  onChange: (next: Label) => void;
};

export function SpecificProductsCard({
  value,
  onChange,
}: SpecificProductsCardProps) {
  const { getRule, updateRule, addRule, hasRule } = useConditions(
    value,
    onChange
  );
  const productSlugsRule = getRule("productSlugs");
  const productSlugs = productSlugsRule?.values ?? [];

  const [resolvedOptions, setResolvedOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (productSlugs.length === 0) {
      setResolvedOptions([]);
      return;
    }
    getProductsBySlugs(productSlugs)
      .then((products) => {
        setResolvedOptions(
          products.map((p) => ({
            id: p.id,
            label: p.label,
            slug: p.slug,
          }))
        );
      })
      .catch(() => {
        setResolvedOptions([]);
      });
  }, []);

  const handleChange = useCallback(
    (options: Option[]) => {
      setResolvedOptions(options);
      const slugs = options.map((o) => o.slug).filter(Boolean);
      if (hasRule("productSlugs")) {
        updateRule({ type: "productSlugs", values: slugs });
      } else {
        addRule({ type: "productSlugs", values: slugs });
      }
    },
    [hasRule, updateRule, addRule]
  );

  const fetchOptions = useCallback(
    (input: string) => searchProductsByName(input),
    []
  );

  return (
    <Card>
      <Card.Header
        title="Specific products"
        subtitle="Search and select products that will show this badge"
      />
      <Card.Divider />
      <Card.Content>
        <AsyncMultiSelect
          value={resolvedOptions}
          onChange={handleChange}
          fetchOptions={fetchOptions}
          placeholder="Search products by name…"
        />
      </Card.Content>
    </Card>
  );
}
