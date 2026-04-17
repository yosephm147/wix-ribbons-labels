import { type FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Heading, IconButton, Text } from "@wix/design-system";
import { X } from "@wix/wix-ui-icons-common";

const ratingOptions = [1, 2, 3, 4, 5];
const INITIAL_SHOW_DELAY_MS = 1000;
const CLOSE_ANIMATION_MS = 450;

type BottomFeedbackPopupProps = {
  isOpen: boolean;
  onHighRating: (rating: number) => Promise<void> | void;
  onLowRating: (rating: number) => void;
};

const BottomFeedbackPopup: FC<BottomFeedbackPopupProps> = ({
  isOpen,
  onHighRating,
  onLowRating,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const restoreTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    let frame = 0;
    const timeout = window.setTimeout(() => {
      frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, INITIAL_SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
      if (closeTimeoutRef.current != null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (restoreTimeoutRef.current != null) {
        window.clearTimeout(restoreTimeoutRef.current);
      }
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      setIsVisible(false);
    };
  }, [isOpen]);

  const handleMinimize = () => {
    setIsVisible(false);
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsMinimized(true);
    }, CLOSE_ANIMATION_MS);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    restoreTimeoutRef.current = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      restoreTimeoutRef.current = null;
    }, 100);
  };

  const handleRatingClick = (rating: number) => {
    if (rating >= 4) {
      void onHighRating(rating);
      return;
    }
    onLowRating(rating);
    setIsMinimized(true);
  };

  if (!isOpen || typeof document === "undefined") return null;

  if (isMinimized) {
    return createPortal(
      <button
        type="button"
        onClick={handleRestore}
        aria-label="Reopen feedback popup"
        style={{
          position: "fixed",
          bottom: "10px",
          left: "25%",
          zIndex: 2050,
          border: "none",
          borderRadius: 999,
          padding: "8px 12px",
          background: "#1f49b6",
          color: "#ffffff",
          fontSize: 13,
          lineHeight: 1,
          cursor: "pointer",
          boxShadow: "0 10px 20px rgba(17, 24, 39, 0.2)",
        }}
      >
        Your feedback matters!
      </button>,
      document.body
    );
  }

  return createPortal(
    <Box
      direction="vertical"
      gap="SP3"
      padding="SP4"
      width="80%"
      maxWidth="380px"
      height="150px"
      style={{
        position: "fixed",
        bottom: "10px",
        left: "50%",
        transform: isVisible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(16px)",
        opacity: isVisible ? 1 : 0,
        transition: "transform 450ms ease-out, opacity 450ms ease-out",
        zIndex: 2050,
        background: "#ffffff",
        border: "1px solid #ebeff5",
        borderRadius: 16,
        boxShadow: "0 18px 34px rgba(17, 24, 39, 0.16)",
        alignItems: "center",
      }}
    >
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <IconButton
          size="small"
          priority="tertiary"
          ariaLabel="Dismiss feedback popup"
          onClick={handleMinimize}
        >
          <X />
        </IconButton>
      </div>
      <Box direction="vertical" align="center" verticalAlign="top" gap="SP1">
        <Heading size="medium" as="h1">
          Enjoying Ribbons & Labels so far?
        </Heading>
        <Text
          size="small"
          secondary
          align="center"
          style={{ lineHeight: "22px", maxWidth: 560 }}
        >
          {`💬 If you've enjoyed using our app, drop us a quick review. Thank you for your support!`}
        </Text>
      </Box>

      <Box direction="horizontal" style={{ paddingTop: 8 }}>
        {ratingOptions.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(null)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 28,
              lineHeight: 1,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              color: value <= (hoveredRating ?? 0) ? "#f5b301" : "#d7dee7",
            }}
          >
            ★
          </button>
        ))}
      </Box>
    </Box>,
    document.body
  );
};

export default BottomFeedbackPopup;
