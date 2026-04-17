import React, { type FC, type ReactNode } from "react";

const PHONE_WIDTH = 272;
const BORDER_WIDTH = 3;
const BORDER_RADIUS = 38;

export const PhoneFrame: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "16px 0 24px",
    }}
  >
    <div
      style={{
        width: PHONE_WIDTH,
        borderRadius: BORDER_RADIUS,
        border: `${BORDER_WIDTH}px solid #b8b8b8`,
        backgroundColor: "#fff",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
        boxSizing: "border-box",
      }}
    >
      {/* Status bar / notch */}
      <div
        style={{
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 58,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#c0c0c0",
          }}
        />
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          paddingBottom: 24,
          overflowY: "auto",
          maxHeight: 560,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

export default PhoneFrame;
