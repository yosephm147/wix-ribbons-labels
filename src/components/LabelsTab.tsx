import { type FC, useState } from "react";
import {
  Box,
  Button,
  Card,
  IconButton,
  Loader,
  PopoverMenu,
  Text,
} from "@wix/design-system";
import {
  AddSmall,
  DeleteSmall,
  DuplicateSmall,
  EditSmall,
  LockLockedSmall,
  More,
} from "@wix/wix-ui-icons-common";
import type { Label } from "@/extensions/dashboard/pages/types.ts";
import { createNewLabel } from "@/utils/labelDefaults";
import UnlockLabelsModal from "@/components/UnlockLabelsModal";

export type LabelsTabProps = {
  labels: Label[];
  isLoading: boolean;
  isSaving: boolean;
  isLabelsUnlocked: boolean;
  onStartEdit: (label: Label) => void;
  onUnlockLabels: () => Promise<boolean>;
  onDeleteLabel: (label: Label) => void;
  onDuplicateLabel: (label: Label) => void | Promise<void>;
};

const normalizeLabelMessageForDisplay = (message?: string) => {
  const labelRaw = message || "<b>SALE</b>";
  const isBold = labelRaw.includes("<b>");
  const isUnderline = labelRaw.includes("<u>");
  const isItalic = labelRaw.includes("<i>");

  const label = labelRaw.replace(/<[^>]*>/g, "").trim();
  return (
    <Text weight="normal">
      <span
        style={{
          fontWeight: isBold ? "bold" : "normal",
          textDecoration: isUnderline ? "underline" : "none",
          fontStyle: isItalic ? "italic" : "normal",
          display: "block",
          width: "100%",
        }}
      >
        {label}
      </span>
    </Text>
  );
};

const LabelsTab: FC<LabelsTabProps> = ({
  labels,
  isLoading,
  isSaving,
  isLabelsUnlocked,
  onStartEdit,
  onUnlockLabels,
  onDeleteLabel,
  onDuplicateLabel,
}) => {
  const [hoveredLabelId, setHoveredLabelId] = useState<string | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  const handleUnlockModalConfirm = async () => {
    if (isSaving) return;
    try {
      const unlocked = await onUnlockLabels();
      if (!unlocked) return;
      setIsUnlockModalOpen(false);
    } catch (error) {
      console.error("[ribbons] failed to unlock labels:", error);
    }
  };
  const handleCreateFirstLabel = async () => {
    if (isSaving) return;
    try {
      onStartEdit(createNewLabel());
    } catch (error) {
      console.error("[ribbons] failed to unlock labels:", error);
    }
  };

  if (isLoading) {
    return (
      <Box align="center" verticalAlign="middle" height="200px">
        <Loader text="Loading labels..." />
      </Box>
    );
  }

  return (
    <Box direction="vertical" gap="24px">
      {labels.length > 0 && (
        <Box direction="horizontal">
          <Box marginLeft="auto">
            <Button
              priority="primary"
              size="medium"
              onClick={() => onStartEdit(createNewLabel())}
              disabled={isSaving}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
                Add new label
              </span>
            </Button>
          </Box>
        </Box>
      )}
      {labels.length === 0 ? (
        <Card>
          <Card.Content size="none">
            <Box
              align="center"
              direction="vertical"
              gap="12px"
              verticalAlign="middle"
              minHeight="260px"
              style={{
                textAlign: "center",
                background: "#fafbfe",
                borderRadius: 10,
                padding: "28px 24px",
              }}
            >
              <Box
                align="center"
                verticalAlign="middle"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#eef2ff",
                  color: "#3d5afe",
                  marginBottom: 2,
                }}
              >
                <AddSmall />
              </Box>
              <Text weight="bold" size="medium">
                No labels yet
              </Text>
              <Text size="small" secondary>
                Add labels to highlight products with sales, badges, or
                promotions.
              </Text>
              {!isLabelsUnlocked ? (
                <Button
                  priority="primary"
                  size="small"
                  prefixIcon={<LockLockedSmall />}
                  onClick={() => setIsUnlockModalOpen(true)}
                  disabled={isSaving}
                >
                  Unlock to create your a label
                </Button>
              ) : (
                <Button
                  priority="primary"
                  size="small"
                  onClick={handleCreateFirstLabel}
                  disabled={isSaving}
                >
                  Create your first label
                </Button>
              )}
            </Box>
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Header title="Labels" />
          <Card.Content>
            <Box direction="vertical" gap="12px">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(160px, 1fr) minmax(150px, 0.95fr) 190px 120px 72px",
                  alignItems: "center",
                  gap: 16,
                  padding: "0 14px",
                }}
              >
                <Text size="small" secondary>
                  Name
                </Text>
                <Text size="small" secondary>
                  Message
                </Text>
                <Text size="small" secondary>
                  Shape
                </Text>
                <Text size="small" secondary>
                  Status
                </Text>
                <Text size="small" secondary>
                  Actions
                </Text>
              </div>

              {labels.map((row) => {
                const enabled = row.enabled;
                const isHovered = hoveredLabelId === row.id;

                return (
                  <div
                    key={row.id}
                    onMouseEnter={() => setHoveredLabelId(row.id)}
                    onMouseLeave={() => setHoveredLabelId(null)}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(160px, 1fr) minmax(150px, 0.95fr) 190px 120px 72px",
                      alignItems: "center",
                      gap: 16,
                      minHeight: 60,
                      padding: "14px",
                      borderRadius: 10,
                      background: isHovered ? "#f6f9ff" : "#ffffff",
                      boxShadow: isHovered
                        ? "0 6px 14px rgba(44, 83, 160, 0.10)"
                        : "none",
                      border: "1px solid #edf1f8",
                      transition:
                        "background-color 140ms ease, box-shadow 160ms ease",
                    }}
                  >
                    <Text>{row.name || "—"}</Text>
                    {normalizeLabelMessageForDisplay(row.text.message)}
                    <Text>{row.shape}</Text>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        padding: "2px 7px 2px 7px",
                        borderRadius: 16,
                        border: `1.5px solid ${
                          enabled ? "#c7edda" : "#e2e2e2"
                        }`,
                        background: enabled ? "#f5fbf7" : "#f6f6f6",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        width: "58px",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: enabled ? "#4aa378" : "#b0b0b0",
                          flexShrink: 0,
                        }}
                      />
                      <Text>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: enabled ? "#1a6e3c" : "#6b6b6b",
                            fontFamily: "inherit",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {enabled ? "Active" : "Inactive"}
                        </span>
                      </Text>
                    </div>
                    <PopoverMenu
                      placement="bottom-end"
                      triggerElement={
                        <IconButton
                          size="small"
                          priority="secondary"
                          ariaLabel="Label actions"
                          disabled={isSaving}
                        >
                          <More />
                        </IconButton>
                      }
                    >
                      <PopoverMenu.MenuItem
                        text="Edit"
                        prefixIcon={<EditSmall />}
                        onClick={() => onStartEdit(row)}
                        disabled={isSaving}
                      />
                      <PopoverMenu.MenuItem
                        text="Duplicate"
                        prefixIcon={<DuplicateSmall />}
                        onClick={() => void onDuplicateLabel(row)}
                        disabled={isSaving}
                      />
                      <PopoverMenu.MenuItem
                        text="Delete"
                        skin="destructive"
                        prefixIcon={<DeleteSmall />}
                        onClick={() => onDeleteLabel(row)}
                        disabled={isSaving}
                      />
                    </PopoverMenu>
                  </div>
                );
              })}
            </Box>
          </Card.Content>
        </Card>
      )}
      <UnlockLabelsModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        isSaving={isSaving}
        onUnlockAndContinue={handleUnlockModalConfirm}
      />
    </Box>
  );
};

export default LabelsTab;
