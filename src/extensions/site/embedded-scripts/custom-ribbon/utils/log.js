// Flip to true when you need frontend ribbon debug logs.
export var ENABLE_WIX_RIBBONS_LOGS = false;

export function wixRibbonsLog(error, ...args) {
  if (!ENABLE_WIX_RIBBONS_LOGS) return;
  if (error) {
    console.error(...args);
  } else {
    console.log(...args);
  }
}
