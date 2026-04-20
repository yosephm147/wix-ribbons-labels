import React, { useEffect, useState, type FC } from "react";
import { dashboard } from "@wix/dashboard";
import { appInstances } from "@wix/app-management";
import { httpClient } from "@wix/essentials";
import { Box, Button, Page, Tabs, TopBanner } from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import "./page.css";
import withProviders from "./withProviders";
import LabelsTab from "@/components/LabelsTab";
import RibbonEditorPage from "@/components/editor/RibbonEditorPage";
import PricingTabNew from "@/components/PricingTabNew";
import FirstSuccessFeedbackModal from "@/components/FirstSuccessFeedbackModal";
import BottomFeedbackPopup from "@/components/BottomFeedbackPopup";
import SupportChat from "@/components/SupportChat";
import type { Label } from "./types";
import { useRibbonLabels } from "./useRibbonLabels";
import { WIX_APP_MARKET_REVIEW_URL } from "@/constants/wixAppMarketReviewUrl";

const MANAGE_INSTALLED_APPS_PAGE_ID = "ad471122-7305-4007-9210-2a764d2e5e57";

type TabId = "labels" | "pricing";

type SupportChatContext = {
  instanceId: string;
  siteId: string;
  siteUrl: string;
  merchantEmail: string | null;
  merchantName: string | null;
  plan: string | null;
};

const TAB_ITEMS: { id: TabId; title: string }[] = [
  { id: "labels", title: "Labels" },
  { id: "pricing", title: "Pricing" },
];

const RibbonSettingsPage: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("labels");
  const [editLabel, setEditLabel] = useState<Label | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isFirstSuccessSubmitting, setIsFirstSuccessSubmitting] =
    useState(false);
  const [isFirstSuccessModalOpen, setIsFirstSuccessModalOpen] = useState(false);
  const [isFeedbackPopupOpen, setIsFeedbackPopupOpen] = useState(false);
  const [popupFeedbackRating, setPopupFeedbackRating] = useState<number | null>(
    null
  );
  const [supportChatContext, setSupportChatContext] =
    useState<SupportChatContext | null>(null);

  const tidioKey = import.meta.env.PUBLIC_TIDIO_KEY ?? "";

  const {
    labels,
    storeIdentity,
    storeSettings,
    isLoading,
    isSaving,
    isLabelsUnlocked,
    saveLabel,
    unlockLabels,
    deleteLabelById,
    duplicateLabel,
    applyStoreSettingsUpdate,
  } = useRibbonLabels();
  // https://www.wix.com/apps/upgrade/ae6e3d23-777d-4246-9403-531514aab8d4?appInstanceId=d732e9cb-8991-4246-b105-b2be7527a888
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const origin = new URL(import.meta.url).origin;
        const res = await httpClient.fetchWithAuth(
          `${origin}/api/latest-app-version`
        );
        if (!res.ok || cancelled) return;
        const { latestVersion: latest } = (await res.json()) as {
          latestVersion?: string | null;
        };
        const installed = __RIBBONS_RELEASE_VERSION__;
        const latestMajorVersion = latest?.split(".")[0];
        const installedMajorVersion = installed.split(".")[0];
        if (
          !cancelled &&
          typeof latest === "string" &&
          latest.length > 0 &&
          latestMajorVersion !== installedMajorVersion
        ) {
          setShowUpdateBanner(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const app = await appInstances.getAppInstance();
        const instanceId = app.instance?.instanceId;
        const siteId = app.site?.siteId;
        const siteUrl = app.site?.url ?? "";
        if (!instanceId || !siteId || !siteUrl || cancelled) return;
        const merchantEmail =
          app.site?.ownerEmail ?? app.site?.ownerInfo?.email ?? null;
        const merchantName = app.site?.siteDisplayName ?? null;
        const plan = app.instance?.billing?.packageName ?? "Free";
        setSupportChatContext({
          instanceId,
          siteId,
          siteUrl,
          merchantEmail,
          merchantName,
          plan,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isFirstSuccessModalOpen) {
      setIsFeedbackPopupOpen(false);
    } else if (editLabel != null) {
      setIsFeedbackPopupOpen(false);
    } else if (
      storeSettings?.seenFirstSuccessModal &&
      !storeSettings?.hasGivenFeedback
    ) {
      setIsFeedbackPopupOpen(true);
    } else {
      setIsFeedbackPopupOpen(false);
    }
  }, [
    isFirstSuccessModalOpen,
    storeSettings?.seenFirstSuccessModal,
    storeSettings?.hasGivenFeedback,
    editLabel,
  ]);

  const handleSave = async (label: Label) => {
    if (editLabel == null || isSaving) return;
    await saveLabel(label);
    if (storeIdentity && !storeSettings?.seenFirstSuccessModal) {
      setIsFirstSuccessModalOpen(true);
      try {
        await applyStoreSettingsUpdate({ seenFirstSuccessModal: true });
      } catch (error) {
        console.error(
          "[ribbons] failed to persist first-success modal flag:",
          error
        );
      }
    }
    dashboard.showToast({ message: "Label saved", type: "success" });
    setEditLabel(null);
  };

  const dismissFirstSuccessModal = async () => {
    setIsFirstSuccessModalOpen(false);
  };

  const handlePopupHighRating = async (rating: number) => {
    if (isFirstSuccessSubmitting) return;
    window.open(WIX_APP_MARKET_REVIEW_URL, "_blank", "noopener,noreferrer");
    await handleCompleteFeedback({ rating, feedbackText: "" });
  };

  const handleCompleteFeedback = async (input: {
    rating: number;
    feedbackText: string;
    hasGivenFeedback?: boolean;
  }) => {
    if (isFirstSuccessSubmitting) return;
    setIsFirstSuccessSubmitting(true);
    try {
      await applyStoreSettingsUpdate({
        hasGivenFeedback:
          input.hasGivenFeedback !== undefined ? input.hasGivenFeedback : true,
        rating: input.rating,
        feedbackText: input.feedbackText,
      });
      setIsFirstSuccessModalOpen(false);
      setPopupFeedbackRating(null);
      dashboard.showToast({
        message: "Thanks for your feedback",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit feedback";
      dashboard.showToast({ message, type: "error" });
    } finally {
      setIsFirstSuccessSubmitting(false);
    }
  };

  const handleContactUs = async (type: "contact-fix" | "contact-help") => {
    setIsFirstSuccessModalOpen(false);
    const tidio = window.tidioChatApi;
    if (tidio) {
      tidio.open();
      tidio.messageFromVisitor(
        type === "contact-fix"
          ? "Hi, I'm having trouble setting up my ribbons."
          : "Hi, I have a question about the app."
      );
    }
  };

  return (
    <Page className="page-container">
      <Page.Header
        title="Ribbons & Labels"
        subtitle="Configure ribbons and labels for your store."
      />
      <Page.Content className="page-content">
        {showUpdateBanner && (
          <Box marginBottom="SP4">
            <TopBanner
              position="static"
              dismissible={false}
              className="update-banner"
              action={
                <Button
                  size="small"
                  onClick={() =>
                    dashboard.navigate({
                      pageId: MANAGE_INSTALLED_APPS_PAGE_ID,
                    })
                  }
                >
                  Open settings
                </Button>
              }
            >
              New improvements available. Update your app to get the latest
              features and fixes.
            </TopBanner>
          </Box>
        )}
        <Box direction="vertical" gap="0" className="page-body">
          {editLabel === null && (
            <Tabs
              activeId={activeTab}
              items={TAB_ITEMS}
              onClick={(item) => setActiveTab(item.id as TabId)}
              type="uniformFull"
              size="medium"
            />
          )}
          <Box
            marginTop="SP4"
            direction="vertical"
            gap="SP4"
            marginBottom="SP1"
          >
            {activeTab === "labels" && editLabel === null && (
              <LabelsTab
                labels={labels}
                isLoading={isLoading}
                isSaving={isSaving}
                isLabelsUnlocked={isLabelsUnlocked}
                onStartEdit={setEditLabel}
                onUnlockLabels={unlockLabels}
                onDeleteLabel={deleteLabelById}
                onDuplicateLabel={duplicateLabel}
              />
            )}
            {editLabel != null && (
              <RibbonEditorPage
                label={editLabel}
                // label={createNewLabel()}
                onSave={handleSave}
                isSaving={isSaving}
                onBack={() => setEditLabel(null)}
              />
            )}
            {activeTab === "pricing" && <PricingTabNew />}
          </Box>
        </Box>
        <FirstSuccessFeedbackModal
          isOpen={isFirstSuccessModalOpen}
          siteUrl={storeIdentity?.siteUrl ?? ""}
          isSubmitting={isFirstSuccessSubmitting}
          initialStep={
            popupFeedbackRating == null ? "see-result" : "internal-feedback"
          }
          initialRating={popupFeedbackRating ?? 0}
          initialDelay={popupFeedbackRating ? 0 : undefined}
          onDismiss={async () => {
            setPopupFeedbackRating(null);
            await dismissFirstSuccessModal();
          }}
          onCompleteFeedback={handleCompleteFeedback}
          onContactUs={handleContactUs}
        />
        <BottomFeedbackPopup
          isOpen={isFeedbackPopupOpen}
          onHighRating={handlePopupHighRating}
          onLowRating={(rating) => {
            setPopupFeedbackRating(rating);
            setIsFeedbackPopupOpen(false);
            setIsFirstSuccessModalOpen(true);
          }}
        />
        {supportChatContext && tidioKey ? (
          <SupportChat {...supportChatContext} tidioKey={tidioKey} />
        ) : null}
      </Page.Content>
    </Page>
  );
};

export default withProviders(RibbonSettingsPage);
