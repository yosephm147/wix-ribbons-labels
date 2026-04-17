import { useState, type FC } from "react";
import { Box, Tabs } from "@wix/design-system";
import type { Label } from "@/extensions/dashboard/pages/types";
import ProductsTab from "./tabs/ProductsTab";
import DesignTab from "./tabs/DesignTab";
import DisplayTab from "./tabs/DisplayTab";

export type PanelTabId = "design" | "products" | "display";

const PANEL_TAB_ITEMS: { id: PanelTabId; title: string }[] = [
  { id: "design", title: "Design" },
  { id: "products", title: "Products" },
  { id: "display", title: "Display" },
];

export type LabelDesignPanelProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const LabelDesignPanel: FC<LabelDesignPanelProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<PanelTabId>("design");

  return (
    <Box direction="vertical" gap="SP4" width="100%">
      <Tabs
        activeId={activeTab}
        items={PANEL_TAB_ITEMS}
        onClick={({ id }) => setActiveTab(id as PanelTabId)}
        type="uniformFull"
        size="small"
        className="label-design-panel-tabs"
      />
      <Box marginTop="SP4">
        {activeTab === "design" && (
          <DesignTab value={value} onChange={onChange} />
        )}
        {activeTab === "products" && (
          <ProductsTab value={value} onChange={onChange} />
        )}
        {activeTab === "display" && (
          <DisplayTab value={value} onChange={onChange} />
        )}
      </Box>
    </Box>
  );
};

export default LabelDesignPanel;
