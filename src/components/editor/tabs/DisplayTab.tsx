import React, { useState, type FC } from "react";
import { Box, Card, Checkbox, Collapse, IconButton } from "@wix/design-system";
import { ChevronDown, ChevronUp } from "@wix/wix-ui-icons-common";
import type { DisplayPages, Label } from "@/extensions/dashboard/pages/types";

const DEFAULT_DISPLAY_PAGES: DisplayPages = {
  productPage: true,
  collectionPage: true,
  homePage: true,
  searchPage: true,
};

const PAGE_OPTIONS: { key: keyof DisplayPages; label: string }[] = [
  { key: "productPage", label: "Product page" },
  { key: "collectionPage", label: "Collections" },
  { key: "homePage", label: "Home page" },
  { key: "searchPage", label: "Search page" },
];

export type DisplayTabProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const DisplayTab: FC<DisplayTabProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(true);
  const displayPages: DisplayPages =
    value.displayPages ?? DEFAULT_DISPLAY_PAGES;

  const setDisplayPage = (key: keyof DisplayPages, checked: boolean) => {
    onChange({
      ...value,
      displayPages: { ...displayPages, [key]: checked },
    });
  };

  return (
    <Box direction="vertical" gap="SP4" width="100%">
      <Card>
        <Card.Header
          title="Page display"
          suffix={
            <IconButton
              size="large"
              priority="tertiary"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </IconButton>
          }
        />
        <Collapse open={open}>
          <Card.Divider />
          <Card.Content>
            <Box direction="vertical" gap="SP2">
              {PAGE_OPTIONS.map(({ key, label }) => (
                <Checkbox
                  key={key}
                  checked={displayPages[key]}
                  onChange={(e) => setDisplayPage(key, e.target.checked)}
                >
                  {label}
                </Checkbox>
              ))}
            </Box>
          </Card.Content>
        </Collapse>
      </Card>
    </Box>
  );
};

export default DisplayTab;
