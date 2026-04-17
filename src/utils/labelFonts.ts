import { createElement, type ReactNode } from "react";

/**
 * Font presets for badge text. `stack` is a full CSS `font-family` list (web-safe / system),
 * except the theme default row which uses `inherit`.
 * Kept in sync with `custom-ribbon/utils/labelFonts.js` for the site embed.
 */
export type LabelFontOption = {
  id: string;
  label: string;
  stack: string;
};

/**
 * Dropdown-only id for theme default (WDS Dropdown does not treat `selectedId: ""` as selected).
 * Persisted `text.font` stays omitted / undefined — never save this id to the label.
 */
export const THEME_FONT_DROPDOWN_ID = "theme_default";

/** First option uses `THEME_FONT_DROPDOWN_ID`; saving clears `text.font` (site / theme cascade). */
export const FONT_OPTIONS: readonly LabelFontOption[] = [
  {
    id: THEME_FONT_DROPDOWN_ID,
    label: "Default (Same as theme)",
    stack: "sans-serif",
  },
  {
    id: "arial",
    label: "Arial",
    stack:
      'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", "Nimbus Sans L", ui-sans-serif, sans-serif',
  },
  {
    id: "helvetica",
    label: "Helvetica",
    stack:
      'Helvetica, Arial, "Liberation Sans", "Nimbus Sans L", "Helvetica Neue", ui-sans-serif, sans-serif',
  },
  {
    id: "times_new_roman",
    label: "Times New Roman",
    stack:
      '"Times New Roman", Times, "Liberation Serif", "Nimbus Roman No9 L", Cambria, ui-serif, Georgia, serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    stack:
      'Georgia, Cambria, "Times New Roman", Times, "Liberation Serif", ui-serif, serif',
  },
  {
    id: "courier_new",
    label: "Courier New",
    stack:
      '"Courier New", Courier, "Liberation Mono", "Nimbus Mono L", "Lucida Console", ui-monospace, monospace',
  },
  {
    id: "verdana",
    label: "Verdana",
    stack:
      'Verdana, Geneva, "DejaVu Sans", "Lucida Grande", ui-sans-serif, sans-serif',
  },
  {
    id: "trebuchet_ms",
    label: "Trebuchet MS",
    stack:
      '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Segoe UI", Arial, ui-sans-serif, sans-serif',
  },
] as const;

/** Same as `THEME_FONT_DROPDOWN_ID` — use for `selectedId` when `text.font` is unset. */
export const DEFAULT_LABEL_FONT_ID = THEME_FONT_DROPDOWN_ID;

const stacksById = new Map(FONT_OPTIONS.map((o) => [o.id, o.stack]));

/**
 * Dropdown `selectedId` for stored `text.font` (preset id, or exact stack string match).
 */
export function normalizeLabelFontId(stored: string | undefined): string {
  if (stored == null || stored === "") return DEFAULT_LABEL_FONT_ID;
  if (stacksById.has(stored)) return stored;
  const matchByStack = FONT_OPTIONS.find((o) => o.stack === stored);
  if (matchByStack) return matchByStack.id;
  return DEFAULT_LABEL_FONT_ID;
}

/**
 * WDS Dropdown: `value` is the list row (styled); `label` is plain text for the closed input
 * (`DEFAULT_VALUE_PARSER` uses `label` when `value` is not a string).
 */
export function labelFontDropdownOptions(): {
  id: string;
  label: string;
  value: ReactNode;
}[] {
  return FONT_OPTIONS.map((o) => ({
    id: o.id,
    label: o.label,
    value: createElement(
      "span",
      {
        style: {
          fontFamily: o.stack,
          fontSize: "14px",
          lineHeight: "20px",
        },
      },
      o.label
    ),
  }));
}

/**
 * Resolves stored `text.font` (preset id or raw `font-family` string) for CSS/SVG.
 * Missing / theme default → `sans-serif` (site / parent typography).
 */
export function labelFontCssStack(font: string | undefined): string {
  if (font == null || font === "" || font === THEME_FONT_DROPDOWN_ID) {
    return "sans-serif";
  }
  const preset = stacksById.get(font);
  if (preset) return preset;
  if (font.includes(",") || /\s/.test(font)) {
    return font;
  }
  return "sans-serif";
}
