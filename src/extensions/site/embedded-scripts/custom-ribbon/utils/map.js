var DEFAULT_DISPLAY_PAGES = {
  productPage: true,
  collectionPage: true,
  homePage: true,
  searchPage: true,
};

export function comparePriority(aId, bId, byId) {
  var pa = byId[aId].priority,
    pb = byId[bId].priority;
  if (pa == null && pb == null) return 0;
  if (pa == null) return 1;
  if (pb == null) return -1;
  return pa - pb;
}

/** Single pass: enabled labels + product map + defaults. */
export function buildLabelMap(config) {
  var labelsById = {};
  var productSlugToLabelIds = {};
  var defaultLabelIds = Array.isArray(config.defaultLabelIds)
    ? config.defaultLabelIds.slice()
    : [];

  for (var i = 0; i < config.labels.length; i++) {
    var raw = config.labels[i];
    if (!raw || !raw.id || raw.enabled === false) continue;
    labelsById[raw.id] = {
      id: raw.id,
      enabled: true,
      backgroundColor: raw.backgroundColor || "#E24B4B",
      shape: raw.shape || "rectangle",
      shapeSize: raw.shapeSize || {},
      text: raw.text || {},
      displayPages: raw.displayPages || DEFAULT_DISPLAY_PAGES,
      priority: raw.priority,
    };
  }

  var labelIndex = config.labelIndex;
  if (labelIndex && typeof labelIndex === "object") {
    var labelIds = Object.keys(labelIndex);
    for (var li = 0; li < labelIds.length; li++) {
      var lid = labelIds[li];
      var productMap = labelIndex[lid];
      if (!productMap || typeof productMap !== "object" || Array.isArray(productMap))
        continue;
      var slugs = Object.keys(productMap);
      for (var si = 0; si < slugs.length; si++) {
        var slug = slugs[si];
        if (!productSlugToLabelIds[slug]) productSlugToLabelIds[slug] = [];
        if (productSlugToLabelIds[slug].indexOf(lid) === -1)
          productSlugToLabelIds[slug].push(lid);
      }
    }
  }

  return {
    labelsById: labelsById,
    productSlugToLabelIds: productSlugToLabelIds,
    defaultLabelIds: defaultLabelIds,
    labelIndex: labelIndex || {},
  };
}
