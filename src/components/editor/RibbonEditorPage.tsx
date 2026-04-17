import React, { useState, useEffect, type FC } from "react";
import {
  Box,
  Button,
  TextButton,
  Cell,
  Divider,
  Loader,
} from "@wix/design-system";
import { ChevronLeft } from "@wix/wix-ui-icons-common";
import LabelDesignPanel from "./LabelDesignPanel";
import LabelPreview from "./LabelPreview";
import { createNewLabel } from "@/utils/labelDefaults";
import type { Label } from "@/extensions/dashboard/pages/types";

function getInitialLabel(label: Label | null): Label {
  return label ?? createNewLabel();
}

export type RibbonEditorPageProps = {
  label: Label | null;
  onSave: (label: Label) => Promise<void>;
  isSaving: boolean;
  onBack: () => void;
};

const RibbonEditorPage: FC<RibbonEditorPageProps> = ({
  label,
  onSave,
  isSaving,
  onBack,
}) => {
  const [designSettings, setDesignSettings] = useState<Label>(() =>
    getInitialLabel(label)
  );

  useEffect(() => {
    setDesignSettings(getInitialLabel(label));
  }, [label?.id]);

  const handleSave = async () => {
    if (isSaving) return;
    await onSave(designSettings);
  };
  return (
    <Box height="84vh" direction="vertical" style={{ overflow: "hidden" }}>
      <Cell>
        <Box direction="vertical" gap="SP3" marginBottom="SP4">
          <Box direction="horizontal" align="center" verticalAlign="middle">
            <Box flexGrow={1}>
              <TextButton
                prefixIcon={<ChevronLeft />}
                skin="dark"
                onClick={onBack}
              >
                Back
              </TextButton>
            </Box>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader size="tiny" color="white" /> : "Save"}
            </Button>
          </Box>
          <Divider />
        </Box>
      </Cell>
      <Box flexGrow={1} direction="horizontal" style={{ overflow: "hidden" }}>
        <Box
          width="40%"
          minWidth="450px"
          style={{ overflowY: "auto", scrollbarWidth: "none" }}
          borderRadius="14px"
        >
          <LabelDesignPanel
            value={designSettings}
            onChange={setDesignSettings}
          />
        </Box>
        <Box width="60%" style={{ overflowY: "auto" }}>
          <LabelPreview
            settings={designSettings}
            onNameChange={(name) =>
              setDesignSettings((prev) => ({ ...prev, name }))
            }
            onEnabledChange={(enabled) =>
              setDesignSettings((prev) => ({ ...prev, enabled }))
            }
          />
        </Box>
      </Box>
    </Box>
  );
};
export default RibbonEditorPage;
