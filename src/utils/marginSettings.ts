import type { CSSProperties } from "react";
import type { MarginSettings } from "@/extensions/dashboard/pages/types";

/** Single margin field from storage: legacy numbers or strings. */
export function normalizeMarginSide(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "";
    // Legacy: 0 meant "unset" for that side; non-zero was px.
    return v === 0 ? "" : String(v);
  }
  if (typeof v === "string") return v.trim();
  return "";
}

export function normalizeMarginSettings(raw: unknown): MarginSettings {
  const empty: MarginSettings = {
    top: "",
    right: "",
    bottom: "",
    left: "",
  };
  if (raw == null || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;
  return {
    top: normalizeMarginSide(o.top),
    right: normalizeMarginSide(o.right),
    bottom: normalizeMarginSide(o.bottom),
    left: normalizeMarginSide(o.left),
  };
}

/** Empty string = omit; any finite number string (including "0") = px offset. */
function parseMarginPx(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function marginsToCssPosition(m: MarginSettings): CSSProperties {
  const topPx = parseMarginPx(m.top);
  const bottomPx = parseMarginPx(m.bottom);
  const leftPx = parseMarginPx(m.left);
  const rightPx = parseMarginPx(m.right);

  const css: CSSProperties = {};

  if (topPx !== null) {
    css.top = topPx;
  } else if (bottomPx !== null) {
    css.bottom = bottomPx;
  } else {
    css.top = "50%";
  }

  if (leftPx !== null) {
    css.left = leftPx;
  } else if (rightPx !== null) {
    css.right = rightPx;
  } else {
    css.left = "50%";
  }

  const transforms: string[] = [];
  if (topPx === null && bottomPx === null) transforms.push("translateY(-50%)");
  if (leftPx === null && rightPx === null) transforms.push("translateX(-50%)");
  if (transforms.length) css.transform = transforms.join(" ");

  return css;
}

/** Horizontal alignment for outside badges (flex row), matching embedded script `outsideJustifyFromMargin`. */
export function outsideBadgeJustifyContent(
  m: MarginSettings
): "flex-start" | "center" | "flex-end" {
  const leftPx = parseMarginPx(m.left);
  const rightPx = parseMarginPx(m.right);
  if (leftPx !== null && rightPx === null) return "flex-start";
  if (rightPx !== null && leftPx === null) return "flex-end";
  return "center";
}

/**
 * Outside-image badges: vertical space vs adjacent title/price blocks, and horizontal inset as padding
 * (so flex `justifyContent` still aligns the badge within the padded area).
 */
export function outsideBadgeFlowBoxStyle(m: MarginSettings): CSSProperties {
  const css: CSSProperties = {};
  const topPx = parseMarginPx(m.top);
  const bottomPx = parseMarginPx(m.bottom);
  const leftPx = parseMarginPx(m.left);
  const rightPx = parseMarginPx(m.right);
  if (topPx !== null) css.marginTop = topPx;
  if (bottomPx !== null) css.marginBottom = bottomPx;
  if (leftPx !== null) css.paddingLeft = leftPx;
  if (rightPx !== null) css.paddingRight = rightPx;
  return css;
}
