/**
 * Parse labels payload from Wix (may be double-wrapped, HTML-escaped, or use backslash-quoted JSON).
 * Do not put literal double-open-brace in source — Wix treats that as a template parameter.
 */
export function parseLabelsJson(raw) {
  if (raw == null) return null;
  var s = String(raw).trim();
  if (!s) return null;
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);

  function decodeHtmlEntities(str) {
    if (str.indexOf("&") === -1) return str;
    var t = document.createElement("textarea");
    t.innerHTML = str;
    return t.value;
  }

  function parseInner(str) {
    var v = JSON.parse(str);
    if (typeof v === "string") v = JSON.parse(String(v).trim());
    return v;
  }

  /** Try strict JSON first; then the backslash-quote fix used by labelsStorage.parseLabels. */
  function tryParse(str) {
    var c = String(str).trim();
    if (!c) return null;
    try {
      return parseInner(c);
    } catch (e1) {
      try {
        return parseInner(c.replace(/\\"/g, '"'));
      } catch (e2) {
        throw e2;
      }
    }
  }

  var candidates = [s];
  if (s.indexOf("&") !== -1) {
    candidates.push(decodeHtmlEntities(s));
  }
  if (s.indexOf("%") !== -1) {
    try {
      candidates.push(decodeURIComponent(s));
    } catch (e) {}
  }

  var lastErr = null;
  for (var i = 0; i < candidates.length; i++) {
    if (!candidates[i]) continue;
    try {
      return tryParse(candidates[i]);
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

export function unwrapLabelsConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  if (Array.isArray(cfg.labels)) return cfg;
  var inner = cfg.labels;
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    Array.isArray(inner.labels)
  ) {
    return {
      version: inner.version,
      labels: inner.labels,
      labelIndex: inner.labelIndex || {},
      defaultLabelIds: Array.isArray(inner.defaultLabelIds)
        ? inner.defaultLabelIds
        : [],
    };
  }
  return null;
}

export function getConfig() {
  return new Promise(function (resolve, reject) {
    var jsonScripts = Array.prototype.slice.call(
      document.querySelectorAll("#wix-custom-ribbon-config-json")
    );
    var jsonScript = jsonScripts[0] || null;
    var legacyEl = document.getElementById("wix-custom-ribbon-config");
    function finish(raw) {
      try {
        if (!raw || String(raw).trim() === "") {
          reject(new Error("empty config"));
          return;
        }
        var cfg = parseLabelsJson(raw);
        var normalized = unwrapLabelsConfig(cfg);
        if (normalized) cfg = normalized;
        if (!cfg || !Array.isArray(cfg.labels)) {
          reject(new Error("invalid config"));
          return;
        }
        resolve(cfg);
      } catch (e) {
        reject(e);
      }
    }
    function fetchScriptRaw(scriptEl) {
      var inline = (scriptEl.textContent || "").trim();
      if (inline) return Promise.resolve(inline);
      var src = scriptEl.getAttribute("src") || scriptEl.src;
      if (!src) return Promise.resolve("");
      return fetch(src).then(function (r) {
        if (!r.ok) throw new Error("labels fetch failed: " + r.status);
        return r.text();
      });
    }
    function normalizeIfValid(raw) {
      if (!raw || String(raw).trim() === "") return null;
      var cfg = parseLabelsJson(raw);
      var normalized = unwrapLabelsConfig(cfg);
      if (normalized) cfg = normalized;
      if (!cfg || !Array.isArray(cfg.labels)) return null;
      return cfg;
    }
    if (jsonScript) {
      // Wix may inject duplicate nodes with the same ID; prefer non-empty labels payload.
      Promise.all(
        jsonScripts.map(function (scriptEl) {
          return fetchScriptRaw(scriptEl).catch(function () {
            return "";
          });
        })
      )
        .then(function (rawList) {
          var fallbackEmpty = null;
          for (var i = 0; i < rawList.length; i++) {
            try {
              var cfg = normalizeIfValid(rawList[i]);
              if (!cfg) continue;
              if (cfg.labels.length > 0) {
                resolve(cfg);
                return;
              }
              if (!fallbackEmpty) fallbackEmpty = cfg;
            } catch (e) {}
          }
          if (fallbackEmpty) {
            resolve(fallbackEmpty);
            return;
          }
          reject(new Error("no labels config"));
        })
        .catch(reject);
      return;
    }
    if (legacyEl) {
      var dl = legacyEl.getAttribute("data-labels");
      if (dl && dl.trim()) {
        finish(dl);
        return;
      }
    }
    reject(new Error("no labels config"));
  });
}
