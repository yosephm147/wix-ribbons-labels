/**
 * Preset stacks by id — must match `FONT_OPTIONS` in `src/utils/labelFonts.ts`.
 */
var LABEL_FONT_STACKS = {
  arial:
    'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", "Nimbus Sans L", ui-sans-serif, sans-serif',
  helvetica:
    'Helvetica, Arial, "Liberation Sans", "Nimbus Sans L", "Helvetica Neue", ui-sans-serif, sans-serif',
  times_new_roman:
    '"Times New Roman", Times, "Liberation Serif", "Nimbus Roman No9 L", Cambria, ui-serif, Georgia, serif',
  georgia:
    'Georgia, Cambria, "Times New Roman", Times, "Liberation Serif", ui-serif, serif',
  courier_new:
    '"Courier New", Courier, "Liberation Mono", "Nimbus Mono L", "Lucida Console", ui-monospace, monospace',
  verdana:
    'Verdana, Geneva, "DejaVu Sans", "Lucida Grande", ui-sans-serif, sans-serif',
  trebuchet_ms:
    '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Segoe UI", Arial, ui-sans-serif, sans-serif',
};

export function labelFontCssStack(font) {
  if (font == null || font === "" || font === "theme_default")
    return "sans-serif";
  var preset = LABEL_FONT_STACKS[font];
  if (preset) return preset;
  if (typeof font === "string") {
    if (font.indexOf(",") >= 0 || /\s/.test(font)) return font;
  }
  return "sans-serif";
}
