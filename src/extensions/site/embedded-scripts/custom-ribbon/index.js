import { getConfig } from "./utils/config.js";
import { buildLabelMap } from "./utils/map.js";
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
    console.log("[WixRibbons] Start Embed", localTimeMs());
  } catch (e) {}
  try {
    getConfig()
      .then(function (config) {
        console.log("[WixRibbons] config", config);
        var map = buildLabelMap(config);
        var ids = Object.keys(map.labelsById);
        if (!ids.length) return;
        run(map, "initial");
        setupObservers(map);
        try {
          console.log(
            "[WixRibbon] End Embed",
            localTimeMs(),
            "(" + (Date.now() - startedAt) + "ms)"
          );
        } catch (e) {}
      })
      .catch(function (e) {
        try {
          console.log("[WixRibbon]", e && e.message ? e.message : e);
        } catch (err) {}
      });
  } catch (err) {
    console.error("[WixRibbon]", err);
  }
}

initRibbon();
