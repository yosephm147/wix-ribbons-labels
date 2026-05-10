import { type FC, type ReactNode } from "react";
import {
  Box,
  Button,
  CustomModalLayout,
  Modal,
  Text,
} from "@wix/design-system";
import { WIX_APP_MARKET_REVIEW_URL } from "@/constants/appInfo";
import { AddSmall, EditSmall, LockLockedSmall } from "@wix/wix-ui-icons-common";

export type UnlockLabelsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onUnlockAndContinue: () => Promise<void>;
};

const openAppMarketReview = () => {
  window.open(WIX_APP_MARKET_REVIEW_URL, "_blank", "noopener,noreferrer");
};

const accent = "#3d5afe";
const surfaceMuted = "#f4f7ff";
const borderSoft = "rgba(61, 90, 254, 0.14)";

const featureRow = (icon: ReactNode, title: string, body: string) => (
  <Box
    direction="horizontal"
    gap="12px"
    verticalAlign="top"
    style={{
      padding: "12px 14px",
      borderRadius: 10,
      background: "#ffffff",
      border: `1px solid ${borderSoft}`,
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
    }}
  >
    <Box
      flexShrink={0}
      align="center"
      verticalAlign="middle"
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: surfaceMuted,
        color: accent,
      }}
    >
      {icon}
    </Box>
    <Box direction="vertical" gap="4px">
      <Text weight="bold" size="small">
        {title}
      </Text>
      <Text size="small" secondary>
        {body}
      </Text>
    </Box>
  </Box>
);

const UnlockLabelsModal: FC<UnlockLabelsModalProps> = ({
  isOpen,
  onClose,
  isSaving,
  onUnlockAndContinue,
}) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} shouldCloseOnOverlayClick>
    <CustomModalLayout
      maxWidth="560px"
      title="Unlock free early access!"
      subtitle="Highlight sales, new arrivals, low stock, and promotions across your store.
      
      The app is currently free during early access. Leave a review during early access to keep the app free for life."
      primaryButtonText="Unlock labels"
      primaryButtonOnClick={() => void onUnlockAndContinue()}
      primaryButtonProps={{ disabled: isSaving }}
      secondaryButtonText="Not now"
      secondaryButtonOnClick={onClose}
      secondaryButtonProps={{ disabled: isSaving }}
      onCloseButtonClick={onClose}
      content={
        <Box direction="vertical" gap="16px" paddingTop="4px">
          <Text weight="bold" size="small">
            What you can do
          </Text>

          <Box direction="vertical" gap="10px">
            {featureRow(
              <AddSmall />,
              "Create your first label",
              "Start with templates, then customize text, shape, colors, and placement."
            )}
            {featureRow(
              <EditSmall />,
              "Control how labels appear",
              "Control placement, sizing, visibility rules, and matching products."
            )}
            {featureRow(
              <LockLockedSmall />,
              "Keep labels updated automatically",
              "Labels automatically stay in sync with sales, inventory, and product changes."
            )}
          </Box>

          <Box
            direction="vertical"
            gap="SP2"
            marginTop="SP3"
            padding="SP4"
            style={{
              borderRadius: 12,
              border: `1px solid rgba(61, 90, 254, 0.17)`,
              background: "#f1f4fb",
            }}
          >
            <Text weight="bold" size="small">
              Like the app so far?
            </Text>
            <Text size="small" secondary>
              Leave a review to keep the app free for life.
            </Text>
            <Box>
              <Button
                priority="secondary"
                size="small"
                onClick={openAppMarketReview}
              >
                Leave a review
              </Button>
            </Box>
          </Box>
        </Box>
      }
    />
  </Modal>
);

export default UnlockLabelsModal;
