import { getConfig } from "./utils/config.js";
import { buildLabelMap } from "./utils/map.js";
import { wixRibbonsLog } from "./utils/log.js";
import { run, setupObservers } from "./utils/main.js";

function localTimeMs() {
  var d = new Date();
  try {
    return d.toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  } catch (e) {
    return d.toLocaleTimeString() + "." + String(d.getMilliseconds());
  }
}

function initRibbon() {
  var startedAt = Date.now();
  try {
    wixRibbonsLog(false, "[WixRibbons] Start Embed", localTimeMs());
  } catch (e) {}
  try {
    getConfig()
      .then(function (config) {
        var map = buildLabelMap(config);
        var ids = Object.keys(map.labelsById);
        if (!ids.length) return;
        run(map, "initial");
        setupObservers(map);
        try {
          wixRibbonsLog(
            false,
            "[WixRibbon] End Embed",
            localTimeMs(),
            "(" + (Date.now() - startedAt) + "ms)"
          );
        } catch (e) {}
      })
      .catch(function (e) {
        try {
          wixRibbonsLog(true, "[WixRibbon]", e && e.message ? e.message : e);
        } catch (err) {}
      });
  } catch (err) {
    wixRibbonsLog(true, "[WixRibbon]", err);
  }
}

initRibbon();
