import React, { type FC } from "react";
import { Box } from "@wix/design-system";
import type { Label } from "@/extensions/dashboard/pages/types";
import BadgeCard from "../designTab/BadgeCard";
import PositionCard from "../designTab/PositionCard";
import ContentCard from "../designTab/ContentCard";
import SizeCard from "../designTab/SizeCard";

export type DesignTabProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const DesignTab: FC<DesignTabProps> = ({ value, onChange }) => {
  return (
    <Box direction="vertical" gap="SP4">
      <BadgeCard value={value} onChange={onChange} />
      <PositionCard value={value} onChange={onChange} />
      <ContentCard value={value} onChange={onChange} />
      <SizeCard value={value} onChange={onChange} />
    </Box>
  );
};

export default DesignTab;
