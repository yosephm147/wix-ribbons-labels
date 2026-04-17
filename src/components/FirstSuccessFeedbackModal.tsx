import { type FC, useEffect, useMemo, useState } from "react";
import { Box, Button, InputArea, Modal, Text } from "@wix/design-system";
import { WIX_APP_MARKET_REVIEW_URL } from "@/constants/wixAppMarketReviewUrl";

type Step =
  | "see-result"
  | "worked"
  | "rating"
  | "internal-feedback"
  | "contact-fix"
  | "contact-help";

export type FirstSuccessFeedbackModalProps = {
  isOpen: boolean;
  siteUrl: string;
  isSubmitting: boolean;
  initialStep?: Step;
  initialRating?: number;
  initialDelay?: number;
  onDismiss: () => Promise<void> | void;
  onCompleteFeedback: (input: {
    rating: number;
    feedbackText: string;
    hasGivenFeedback?: boolean;
  }) => Promise<void> | void;
  onContactUs: (type: "contact-fix" | "contact-help") => void;
};

const ratingOptions = [1, 2, 3, 4, 5];

const FirstSuccessFeedbackModal: FC<FirstSuccessFeedbackModalProps> = ({
  isOpen,
  siteUrl,
  isSubmitting,
  initialStep = "see-result",
  initialRating = 0,
  initialDelay = 1000,
  onDismiss,
  onCompleteFeedback,
  onContactUs,
}) => {
  const [step, setStep] = useState<Step>(initialStep);
  const [rating, setRating] = useState<number>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const canSubmitFeedback = useMemo(
    () => rating > 0 && feedbackText.trim().length > 0,
    [rating, feedbackText]
  );

  useEffect(() => {
    if (!isOpen) {
      setRating(initialRating);
      setHoveredRating(null);
      setFeedbackText("");
      setStep(initialStep);
      setIsVisible(false);
      return;
    }
    setStep(initialStep);
    setRating(initialRating);
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, initialDelay);
    return () => window.clearTimeout(timeoutId);
  }, [initialRating, initialStep, initialDelay, isOpen]);

  if (!isOpen) return null;

  const openSite = () => {
    window.open(siteUrl, "_blank", "noopener,noreferrer");
    setStep("worked");
  };

  const handleWorkedYes = () => setStep("rating");
  const handleWorkedNo = () => setStep("contact-fix");

  const handleRatingPicked = (value: number) => {
    setRating(value);
    if (value === 5 || value === 4) {
      window.open(WIX_APP_MARKET_REVIEW_URL, "_blank", "noopener,noreferrer");
      void onCompleteFeedback({ rating: value, feedbackText: "" });
      return;
    }
    setStep("internal-feedback");
  };

  const handleSubmitFeedback = async () => {
    if (!canSubmitFeedback || isSubmitting) return;
    await onCompleteFeedback({ rating, feedbackText: feedbackText.trim() });
  };

  const handleContactUs = async (type: "contact-fix" | "contact-help") => {
    if (isSubmitting) return;
    await onContactUs(type);
  };

  const handleDismiss = async () => {
    if (rating > 0) {
      await onCompleteFeedback({
        rating,
        feedbackText: feedbackText.trim(),
        hasGivenFeedback: false,
      });
      return;
    }
    void onDismiss();
  };

  return (
    <Modal
      isOpen={isVisible}
      onRequestClose={() => {
        if (!isSubmitting) void onDismiss();
      }}
      shouldCloseOnOverlayClick={!isSubmitting}
      shouldDisplayCloseButton={false}
      contentLabel="First success feedback"
      borderRadius={16}
      zIndex={2100}
      verticalPosition="start"
      horizontalPosition="center"
    >
      <Box
        direction="vertical"
        paddingTop="SP7"
        paddingBottom="SP6"
        paddingLeft="clamp(16px, 4vw, 36px)"
        paddingRight="clamp(16px, 4vw, 36px)"
        // width="100%"
        maxWidth="500px"
        gap="SP5"
        style={{
          minHeight: 300,
          position: "relative",
          // width: "100%",
          margin: "24px auto",
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 25px 40px rgba(0, 0, 0, 0.2)",
          border: "1px solid #e7ebf0",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={handleDismiss}
          disabled={isSubmitting}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 28,
            height: 28,
            border: "none",
            borderRadius: 8,
            background: "#f2f5f8",
            color: "#667786",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {step === "see-result" && (
          <>
            <Box direction="vertical" gap="SP2">
              <Text id="first-success-modal-title" size="medium" weight="bold">
                Your first label is live 🎉
              </Text>
              <Text size="small" secondary>
                Your label is now live. See it on your website.
              </Text>
            </Box>
            <Box direction="horizontal" gap="SP2" style={{ marginTop: 4 }}>
              <Button size="medium" onClick={openSite}>
                View my store
              </Button>
              <Button
                size="medium"
                priority="secondary"
                onClick={() => setStep("contact-help")}
              >
                Not now
              </Button>
            </Box>
          </>
        )}

        {step === "worked" && (
          <>
            <Text id="first-success-modal-title" size="medium" weight="bold">
              Everything look right?
            </Text>
            <Box direction="horizontal" gap="SP2">
              <Button onClick={handleWorkedYes}>Yes, looks good</Button>
              <Button priority="secondary" onClick={handleWorkedNo}>
                Not really
              </Button>
            </Box>
          </>
        )}

        {step === "rating" && (
          <>
            <Box direction="vertical" gap="SP2">
              <Text id="first-success-modal-title" size="medium" weight="bold">
                How&apos;s your experience so far?
              </Text>
              <Text size="small" secondary>
                Pick a quick rating.
              </Text>
            </Box>
            <Box direction="horizontal">
              {ratingOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => handleRatingPicked(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(null)}
                  type="button"
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 28,
                    lineHeight: 1,
                    paddingLeft: 8,
                    paddingRight: 8,
                    color:
                      value <= (hoveredRating ?? rating)
                        ? "#f5b301"
                        : "#d7dee7",
                  }}
                >
                  ★
                </button>
              ))}
            </Box>
          </>
        )}

        {step === "internal-feedback" && (
          <>
            <Box direction="vertical" gap="SP2">
              <Text id="first-success-modal-title" size="medium" weight="bold">
                Want to share what you liked or what could be improved?
              </Text>
              <Box direction="vertical" gap="SP1">
                <Text size="small" secondary>
                  Tell us what you liked, disliked, or what could be done
                  better.
                </Text>
                <Text size="small" secondary>
                  This helps us improve.
                </Text>
              </Box>
            </Box>
            <Box direction="horizontal">
              {ratingOptions.map((value) => (
                <button
                  key={`feedback-rating-${value}`}
                  onClick={() => setRating(value)}
                  type="button"
                  aria-label={`Feedback rating ${value} star${
                    value > 1 ? "s" : ""
                  }`}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 22,
                    padding: 0,
                    paddingLeft: 4,
                    paddingRight: 4,
                    lineHeight: 1,
                    color:
                      value <= (hoveredRating ?? rating)
                        ? "#f5b301"
                        : "#d7dee7",
                  }}
                >
                  ★
                </button>
              ))}
            </Box>
            <InputArea
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              minHeight="120px"
              placeholder="Write your feedback..."
            />

            <Box direction="horizontal" gap="SP2">
              <Button
                disabled={!canSubmitFeedback || isSubmitting}
                onClick={handleSubmitFeedback}
              >
                Submit
              </Button>
              <Button
                priority="secondary"
                disabled={isSubmitting}
                onClick={() => setStep("contact-help")}
              >
                Skip
              </Button>
            </Box>
          </>
        )}

        {step === "contact-fix" && (
          <>
            <Box direction="vertical" gap="SP2">
              <Text id="first-success-modal-title" size="medium" weight="bold">
                We&apos;ll help you fix it quickly
              </Text>
              <Text size="small" secondary>
                Contact us and we&apos;ll help you get this working quickly.
              </Text>
            </Box>
            <Box direction="horizontal" gap="SP2">
              <Button onClick={() => void handleContactUs("contact-fix")}>
                Contact us
              </Button>
              <Button
                priority="secondary"
                disabled={isSubmitting}
                onClick={handleDismiss}
              >
                Close
              </Button>
            </Box>
          </>
        )}
        {step === "contact-help" && (
          <>
            <Box direction="vertical" gap="SP2">
              <Text id="first-success-modal-title" size="medium" weight="bold">
                Need help getting started?
              </Text>
              <Text size="small" secondary>
                Reach out anytime and we&apos;ll guide you through setup.
              </Text>
            </Box>
            <Box direction="horizontal" gap="SP2">
              <Button onClick={() => void handleContactUs("contact-help")}>
                Contact us
              </Button>
              <Button
                priority="secondary"
                disabled={isSubmitting}
                onClick={handleDismiss}
              >
                Close
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default FirstSuccessFeedbackModal;
