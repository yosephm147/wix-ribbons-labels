import React, { useState } from "react";
import { Box, Card, Collapse, IconButton, Text } from "@wix/design-system";
import { ChevronDown, ChevronUp } from "@wix/wix-ui-icons-common";

export function ConditionCard({
  title,
  description,
  collapsable = true,
  children,
}: {
  title: string;
  description?: string;
  collapsable?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <Card.Header
        title={title}
        suffix={
          collapsable ? (
            <IconButton
              size="large"
              priority="tertiary"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </IconButton>
          ) : undefined
        }
      />
      <Collapse open={collapsable ? open : true}>
        {description && (
          <Box paddingLeft="SP4" paddingRight="SP4" paddingBottom="SP2">
            <Text secondary size="small">
              {description}
            </Text>
          </Box>
        )}
        <Card.Divider />
        <Box direction="vertical" gap="0">
          {children}
        </Box>
      </Collapse>
    </Card>
  );
}
