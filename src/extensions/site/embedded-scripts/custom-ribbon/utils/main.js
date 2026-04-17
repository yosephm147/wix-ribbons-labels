import {
  getProductSlug,
  getProductContainers,
  getProductPageSlugFromLocation,
  getProductPageMainGalleryInsideContainers,
  ribbonClass,
  wrapperClass,
  dataLabelAttached,
  OUTSIDE_STRIP_ATTR,
  findOutsidePlacementMount,
  findProductPageOutsidePlacementMount,
  getLayoutColumnChild,
} from "./dom.js";
import { comparePriority } from "./map.js";
import {
  renderBadge,
  getShapeSize,
  DEFAULT_MARGIN,
  outsideJustifyFromMargin,
  applyOutsideStripFlowMargins,
} from "./render.js";

var MOBILE_MAX_PX = 768;
var STACK_GAP_PX = 6;
var OUTSIDE_AFTER_ROW_ATTR = "data-wix-label-outside-after-row";
var OUTSIDE_AFTER_KIND_ATTR = "data-wix-outside-after-kind";
var OUTSIDE_AFTER_KIND_PRICE_FULL = "price-full-width";
var OUTSIDE_AFTER_KIND_TITLE_FULL = "title-full-width";

var BADGE_OUTSIDE_SLOTS = [
  "above_product_title",
  "below_product_title",
  "before_product_title",
  "after_product_title",
  "above_product_price",
  "below_product_price",
  "before_product_price",
  "after_product_price",
];
var VARIABLE_TOKEN_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

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

function logRerender(reason) {
  try {
    console.log("[WixRibbon] Rerender:", reason, localTimeMs());
  } catch (e) {}
}

function getRequiredVariableIds(message) {
  var text = message != null ? String(message) : "";
  if (!text) return [];
  VARIABLE_TOKEN_RE.lastIndex = 0;
  var required = [];
  var seen = {};
  var match = VARIABLE_TOKEN_RE.exec(text);
  while (match) {
    var key = match[1];
    if (key && !seen[key]) {
      seen[key] = true;
      required.push(key);
    }
    match = VARIABLE_TOKEN_RE.exec(text);
  }
  return required;
}

function getVariablesForLabelProduct(map, labelId, productSlug) {
  if (!productSlug) return null;
  var labelIndex = map && map.labelIndex;
  if (!labelIndex || typeof labelIndex !== "object") return null;
  var productMap = labelIndex[labelId];
  if (!productMap || typeof productMap !== "object") return null;
  var vars = productMap[productSlug];
  if (!vars || typeof vars !== "object") return null;
  return vars;
}

function hasAllRequiredVariables(label, variables) {
  var required = getRequiredVariableIds(
    label && label.text && label.text.message
  );
  if (!required.length) return true;
  if (!variables) return false;
  for (var i = 0; i < required.length; i++) {
    var key = required[i];
    if (variables[key] == null) return false;
  }
  return true;
}

/** When `newUntil` is set (ISO), hide the label after that instant (client-side new window). */
function labelIndexEntryActiveForNewUntil(variables) {
  if (!variables || variables.newUntil == null || variables.newUntil === "")
    return true;
  var t = Date.parse(String(variables.newUntil));
  if (!Number.isFinite(t)) return true;
  return Date.now() < t;
}

function getBadgeOutsideSlot(label) {
  var s = label.shapeSize && label.shapeSize.badgeOutsideSlot;
  if (BADGE_OUTSIDE_SLOTS.indexOf(s) !== -1) return s;
  return "above_product_title";
}

function isOutsideInlineSlot(slot) {
  return (
    slot === "before_product_title" ||
    slot === "after_product_title" ||
    slot === "before_product_price" ||
    slot === "after_product_price"
  );
}

function isOutsidePlacement(label) {
  return (
    label &&
    label.shapeSize &&
    label.shapeSize.badgeImagePlacement === "outside"
  );
}

function applyOutsideStripSizing(strip, slot) {
  var inline = isOutsideInlineSlot(slot);
  if (inline) {
    strip.style.display = "inline-block";
    strip.style.width = "auto";
    strip.style.alignContent = "center";
    strip.style.maxWidth = "100%";
  } else {
    strip.style.display = "block";
    strip.style.width = "100%";
  }
}

/** PDP outside mount uses layout as link; never move title/price nodes (React will drop or replace them). */
function isPdpProductDetailsOutsideMount(mount) {
  return mount && mount.layout && mount.link && mount.link === mount.layout;
}

/** PDP product page: one attribute encodes row mode (replaces multiple classes). */
var PDP_ROW_ATTR = "data-wix-ribbon-pdp-row";
var PDP_SLOT_ATTR = "data-wix-ribbon-pdp-slot";

/** When the anchor is the only element child, row flex on parent makes adjacent strip inline without moving nodes. */
function maybePdpRowBefore(parent, anchorEl) {
  if (!parent || !anchorEl || parent.children.length !== 1) return;
  if (parent.children[0] !== anchorEl) return;
  parent.setAttribute(PDP_ROW_ATTR, "before");
}

var PDP_PRICE_INLINE_MAX_SIBLINGS = 8;

/**
 * PDP price rows often include compare-at / strikethrough siblings, so the sole-child check fails.
 * Row-flex the prices-container parent when it is inside the layout (not the layout root) and the
 * hook is first or last among a bounded number of element siblings — enough for a horizontal line.
 */
function maybePdpRowBeforePrice(priceEl, layout) {
  var p = priceEl && priceEl.parentElement;
  if (!p) return;
  if (layout && (p === layout || !layout.contains(p))) return;
  var n = p.children.length;
  if (n === 1 && p.children[0] === priceEl) {
    p.setAttribute(PDP_ROW_ATTR, "before");
    return;
  }
  if (
    n <= PDP_PRICE_INLINE_MAX_SIBLINGS &&
    (p.lastElementChild === priceEl || p.firstElementChild === priceEl)
  ) {
    p.setAttribute(PDP_ROW_ATTR, "before");
  }
}

/** PDP after_* : slot grows for margin justify; same role as .wix-custom-ribbon-outside-after-slot. */
function appendPdpAfterSlotAdjacent(anchorEl, strip, slotKind) {
  var slotEl = document.createElement("div");
  slotEl.setAttribute(PDP_SLOT_ATTR, slotKind);
  slotEl.style.justifyContent =
    strip.getAttribute("data-wix-outside-justify") || "center";
  slotEl.appendChild(strip);
  anchorEl.insertAdjacentElement("afterend", slotEl);
}

function insertOutsideStrip(mount, slot, strip) {
  applyOutsideStripSizing(strip, slot);
  var nameEl = mount.nameEl;
  var priceEl = mount.priceEl;
  var layout = mount.layout;
  var link = mount.link;
  var pdpOutside = isPdpProductDetailsOutsideMount(mount);

  function fallbackAppend() {
    if (link) link.appendChild(strip);
  }

  if (slot === "above_product_title") {
    if (layout) layout.insertBefore(strip, layout.firstChild);
    else if (link) link.insertBefore(strip, link.firstChild);
    return;
  }
  if (slot === "below_product_title") {
    if (nameEl && layout) {
      var nameCol = getLayoutColumnChild(nameEl, layout);
      if (nameCol) {
        if (nameCol.nextSibling)
          layout.insertBefore(strip, nameCol.nextSibling);
        else layout.appendChild(strip);
        return;
      }
    }
    fallbackAppend();
    return;
  }
  if (slot === "before_product_title") {
    if (pdpOutside && nameEl && nameEl.parentNode) {
      maybePdpRowBefore(nameEl.parentNode, nameEl);
      nameEl.insertAdjacentElement("beforebegin", strip);
      return;
    }
    if (nameEl && nameEl.parentNode) {
      var parentBeforeTitle = nameEl.parentNode;
      var rowBeforeTitle = document.createElement("div");
      rowBeforeTitle.className = "wix-custom-ribbon-outside-before-row";
      parentBeforeTitle.insertBefore(rowBeforeTitle, nameEl);
      rowBeforeTitle.appendChild(strip);
      rowBeforeTitle.appendChild(nameEl);
    } else if (layout) layout.insertBefore(strip, layout.firstChild);
    else fallbackAppend();
    return;
  }
  if (slot === "after_product_title") {
    if (pdpOutside && nameEl && nameEl.parentNode) {
      nameEl.parentNode.setAttribute(PDP_ROW_ATTR, "after-title");
      appendPdpAfterSlotAdjacent(nameEl, strip, "title");
      return;
    }
    if (nameEl && layout) {
      var nameColFull = getLayoutColumnChild(nameEl, layout);
      if (nameColFull && nameColFull.parentNode === layout) {
        var rowTitleFw = document.createElement("div");
        rowTitleFw.setAttribute(OUTSIDE_AFTER_ROW_ATTR, "true");
        rowTitleFw.setAttribute(
          OUTSIDE_AFTER_KIND_ATTR,
          OUTSIDE_AFTER_KIND_TITLE_FULL
        );
        rowTitleFw.className =
          "wix-custom-ribbon-outside-after-row wix-custom-ribbon-outside-after-row--title-full-width";
        var slotTitleFw = document.createElement("div");
        slotTitleFw.className = "wix-custom-ribbon-outside-after-slot";
        var justifyTitleFw =
          strip.getAttribute("data-wix-outside-justify") || "center";
        slotTitleFw.style.justifyContent = justifyTitleFw;
        layout.insertBefore(rowTitleFw, nameColFull);
        rowTitleFw.appendChild(nameEl);
        applyOutsideStripSizing(strip, slot);
        rowTitleFw.appendChild(slotTitleFw);
        slotTitleFw.appendChild(strip);
        if (!nameColFull.firstElementChild) nameColFull.remove();
        return;
      }
    }
    if (nameEl && nameEl.parentNode) {
      var parentTitle = nameEl.parentNode;
      var rowTitle = document.createElement("div");
      rowTitle.setAttribute(OUTSIDE_AFTER_ROW_ATTR, "true");
      rowTitle.className = "wix-custom-ribbon-outside-after-row";
      var slotTitle = document.createElement("div");
      slotTitle.className = "wix-custom-ribbon-outside-after-slot";
      var justifyTitle =
        strip.getAttribute("data-wix-outside-justify") || "center";
      slotTitle.style.justifyContent = justifyTitle;
      parentTitle.insertBefore(rowTitle, nameEl);
      rowTitle.appendChild(nameEl);
      applyOutsideStripSizing(strip, slot);
      rowTitle.appendChild(slotTitle);
      slotTitle.appendChild(strip);
    } else fallbackAppend();
    return;
  }
  if (slot === "above_product_price") {
    if (priceEl && layout) {
      var priceCol = getLayoutColumnChild(priceEl, layout);
      if (priceCol) {
        layout.insertBefore(strip, priceCol);
        return;
      }
    }
    fallbackAppend();
    return;
  }
  if (slot === "below_product_price") {
    if (priceEl && layout) {
      var priceCol2 = getLayoutColumnChild(priceEl, layout);
      if (priceCol2) {
        if (priceCol2.nextSibling)
          layout.insertBefore(strip, priceCol2.nextSibling);
        else layout.appendChild(strip);
        return;
      }
    }
    fallbackAppend();
    return;
  }
  if (slot === "before_product_price") {
    if (pdpOutside && priceEl && priceEl.parentNode) {
      maybePdpRowBeforePrice(priceEl, layout);
      priceEl.insertAdjacentElement("beforebegin", strip);
      return;
    }
    if (priceEl && priceEl.parentNode) {
      var parentBeforePrice = priceEl.parentNode;
      var rowBeforePrice = document.createElement("div");
      rowBeforePrice.className = "wix-custom-ribbon-outside-before-row";
      parentBeforePrice.insertBefore(rowBeforePrice, priceEl);
      rowBeforePrice.appendChild(strip);
      rowBeforePrice.appendChild(priceEl);
    } else fallbackAppend();
    return;
  }
  if (slot === "after_product_price") {
    if (pdpOutside && priceEl && priceEl.parentNode) {
      priceEl.parentNode.setAttribute(PDP_ROW_ATTR, "after");
      appendPdpAfterSlotAdjacent(priceEl, strip, "price");
      return;
    }
    if (priceEl && layout) {
      var priceColFull = getLayoutColumnChild(priceEl, layout);
      if (priceColFull && priceColFull.parentNode === layout) {
        var rowPw = document.createElement("div");
        rowPw.setAttribute(OUTSIDE_AFTER_ROW_ATTR, "true");
        rowPw.setAttribute(
          OUTSIDE_AFTER_KIND_ATTR,
          OUTSIDE_AFTER_KIND_PRICE_FULL
        );
        rowPw.className =
          "wix-custom-ribbon-outside-after-row wix-custom-ribbon-outside-after-row--price-full-width";
        var slotPw = document.createElement("div");
        slotPw.className =
          "wix-custom-ribbon-outside-after-slot wix-custom-ribbon-outside-after-slot--price";
        var justifyPw =
          strip.getAttribute("data-wix-outside-justify") || "center";
        slotPw.style.justifyContent = justifyPw;
        slotPw.style.minWidth = "0";
        if (priceColFull.nextSibling)
          layout.insertBefore(rowPw, priceColFull.nextSibling);
        else layout.appendChild(rowPw);
        rowPw.appendChild(priceEl);
        applyOutsideStripSizing(strip, slot);
        rowPw.appendChild(slotPw);
        slotPw.appendChild(strip);
        return;
      }
    }
    if (priceEl && priceEl.parentNode) {
      var parentPrice = priceEl.parentNode;
      var rowPrice = document.createElement("div");
      rowPrice.setAttribute(OUTSIDE_AFTER_ROW_ATTR, "true");
      rowPrice.className = "wix-custom-ribbon-outside-after-row";
      var slotPrice = document.createElement("div");
      slotPrice.className =
        "wix-custom-ribbon-outside-after-slot wix-custom-ribbon-outside-after-slot--price";
      var justifyPrice =
        strip.getAttribute("data-wix-outside-justify") || "center";
      slotPrice.style.justifyContent = justifyPrice;
      slotPrice.style.minWidth = "0";
      parentPrice.insertBefore(rowPrice, priceEl);
      rowPrice.appendChild(priceEl);
      applyOutsideStripSizing(strip, slot);
      rowPrice.appendChild(slotPrice);
      slotPrice.appendChild(strip);
    } else fallbackAppend();
    return;
  }
  if (layout) layout.insertBefore(strip, layout.firstChild);
  else if (link) link.insertBefore(strip, link.firstChild);
}

function buildOutsideStrip(
  labelIds,
  labelsById,
  sizeKey,
  slotKey,
  map,
  productSlug
) {
  if (labelIds.length === 0) return null;
  var anchorMargin = labelsById[labelIds[0]].shapeSize.margin || DEFAULT_MARGIN;
  var fragment = document.createDocumentFragment();
  var cumulative = 0;
  var inline = isOutsideInlineSlot(slotKey);
  var alignViaParent =
    slotKey === "after_product_title" || slotKey === "after_product_price";
  for (var i = 0; i < labelIds.length; i++) {
    var lid = labelIds[i];
    var label = labelsById[lid];
    if (!label) continue;
    var variables = getVariablesForLabelProduct(map, lid, productSlug);
    if (!hasAllRequiredVariables(label, variables)) continue;
    if (!labelIndexEntryActiveForNewUntil(variables)) continue;
    var sz = getShapeSize(label, sizeKey);
    var badge = renderBadge(label, {
      sizeKey: sizeKey,
      anchorMargin: anchorMargin,
      stackOffsetPx: cumulative,
      outsideLayout: true,
      outsideStripInline: inline,
      outsideStripAlignViaParent: alignViaParent,
      variables: variables,
    });
    fragment.appendChild(badge);
    cumulative += sz.height + STACK_GAP_PX;
  }
  var strip = document.createElement("div");
  strip.setAttribute(OUTSIDE_STRIP_ATTR, "true");
  if (alignViaParent) {
    strip.setAttribute(
      "data-wix-outside-justify",
      outsideJustifyFromMargin(anchorMargin)
    );
  }
  strip.style.cssText =
    "position:relative;min-height:0;" + (cssAdditions[slotKey] || "");
  applyOutsideStripFlowMargins(strip, anchorMargin);
  strip.appendChild(fragment);
  return strip;
}

function hasOutsideArtifactsForMount(mount) {
  if (!mount) return false;
  var roots = [mount.layout, mount.link, mount.nameEl, mount.priceEl];
  var seen = [];
  for (var i = 0; i < roots.length; i++) {
    var node = roots[i];
    if (!node || node.nodeType !== 1) continue;
    if (seen.indexOf(node) !== -1) continue;
    seen.push(node);
    if (node.hasAttribute && node.hasAttribute(OUTSIDE_STRIP_ATTR)) return true;
    if (
      node.querySelector &&
      (node.querySelector("[" + OUTSIDE_STRIP_ATTR + "]") ||
        node.querySelector("[" + PDP_SLOT_ATTR + "]") ||
        node.querySelector("[" + OUTSIDE_AFTER_ROW_ATTR + "]"))
    ) {
      return true;
    }
  }
  return false;
}

const cssAdditions = {
  before_product_title: "margin-right:6px;",
  before_product_price: "margin-right:6px;",
};

function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: " + MOBILE_MAX_PX + "px)").matches
  );
}

function getDisplayPageKey() {
  var path = (location.pathname || "").toLowerCase();
  var search = (location.search || "").toLowerCase();
  if (/[?&]q=|query=/.test(search) || /\/search|\/search-results/.test(path))
    return "searchPage";
  if (/\/category\/|\/categories\/|\/collection\/|\/collections\//.test(path))
    return "collectionPage";
  if (
    /\/product\//.test(path) ||
    /\/store\/product\//.test(path) ||
    /\/product-page\//.test(path)
  )
    return "productPage";
  if (path === "/" || path === "") return "homePage";
  return "homePage";
}

function labelAllowedOnPage(label, pageKey) {
  var d = label.displayPages;
  if (!d || typeof d !== "object") return true;
  if (pageKey === "productPage") return !!d.productPage;
  if (pageKey === "collectionPage") return !!d.collectionPage;
  if (pageKey === "homePage") return !!d.homePage;
  if (pageKey === "searchPage") return !!d.searchPage;
  return true;
}

function sizeKeyForContext(pageKey) {
  var mobile = isMobileViewport();
  var product = pageKey === "productPage";
  if (mobile) return product ? "mobile_product" : "mobile_collection";
  return product ? "desktop_product" : "desktop_collection";
}

/**
 * @param {object} [opts] When passed, caller is attaching the **main PDP product** (e.g. gallery / image column):
 *   use `productSlug` override and **inside badges only** — PDP outside strips use {@link attachProductPageOutsideLabels}.
 * @param {string} [opts.productSlug] Slug when the mount has no catalog card / link.
 */
function attachLabels(container, map, pageKey, sizeKey, opts) {
  var isPdpMainProductAttach = opts != null;
  opts = opts || {};
  var labelsById = map.labelsById;
  var productSlugToLabelIds = map.productSlugToLabelIds;
  var defaultLabelIds = map.defaultLabelIds;

  var productSlug =
    opts.productSlug != null && String(opts.productSlug) !== ""
      ? String(opts.productSlug)
      : getProductSlug(container);
  var labelIdsForProduct =
    productSlug && productSlugToLabelIds[productSlug]
      ? productSlugToLabelIds[productSlug].slice()
      : defaultLabelIds.slice();

  labelIdsForProduct = labelIdsForProduct.filter(function (lid) {
    var lb = labelsById[lid];
    return lb && labelAllowedOnPage(lb, pageKey);
  });
  labelIdsForProduct.sort(function (a, b) {
    return comparePriority(a, b, labelsById);
  });
  if (labelIdsForProduct.length === 0) return;

  var insideIds = [];
  var outsideIds = [];
  for (var j = 0; j < labelIdsForProduct.length; j++) {
    var lidSplit = labelIdsForProduct[j];
    var lbSplit = labelsById[lidSplit];
    if (!lbSplit) continue;
    if (isOutsidePlacement(lbSplit)) outsideIds.push(lidSplit);
    else insideIds.push(lidSplit);
  }
  if (insideIds.length === 0 && outsideIds.length === 0) return;

  if (container.hasAttribute(dataLabelAttached)) {
    var hasInsideArtifacts = !!container.querySelector("." + ribbonClass);
    var hasOutsideArtifacts = false;
    if (outsideIds.length > 0 && !isPdpMainProductAttach) {
      hasOutsideArtifacts = hasOutsideArtifactsForMount(
        findOutsidePlacementMount(container, productSlug)
      );
    }
    var insideLooksHealthy = insideIds.length === 0 || hasInsideArtifacts;
    var outsideLooksHealthy = outsideIds.length === 0 || hasOutsideArtifacts;
    if (insideLooksHealthy && outsideLooksHealthy) return;
    container.removeAttribute(dataLabelAttached);
  }

  container.setAttribute(dataLabelAttached, "true");
  container.style.position = container.style.position || "relative";
  if (window.getComputedStyle(container).position === "static")
    container.classList.add(wrapperClass);

  function appendBadges(labelIds, parentEl, insertMode, opts) {
    opts = opts || {};
    var outsideLayout = opts.outsideLayout === true;
    var outsideStripInline = opts.outsideStripInline === true;
    if (labelIds.length === 0) return;
    var anchorMargin =
      labelsById[labelIds[0]].shapeSize.margin || DEFAULT_MARGIN;
    var fragment = document.createDocumentFragment();
    var cumulative = 0;
    for (var i = 0; i < labelIds.length; i++) {
      var lid = labelIds[i];
      var label = labelsById[lid];
      if (!label) continue;
      var variables = getVariablesForLabelProduct(map, lid, productSlug);
      if (!hasAllRequiredVariables(label, variables)) continue;
      if (!labelIndexEntryActiveForNewUntil(variables)) continue;
      var sz = getShapeSize(label, sizeKey);
      var badge = renderBadge(label, {
        sizeKey: sizeKey,
        anchorMargin: anchorMargin,
        stackOffsetPx: cumulative,
        outsideLayout: outsideLayout,
        outsideStripInline: outsideStripInline,
        variables: variables,
      });
      fragment.appendChild(badge);
      cumulative += sz.height + STACK_GAP_PX;
    }
    if (insertMode === "prepend") {
      parentEl.insertBefore(fragment, parentEl.firstChild);
    } else {
      parentEl.appendChild(fragment);
    }
  }

  appendBadges(insideIds, container, "prepend");

  if (outsideIds.length > 0 && !isPdpMainProductAttach) {
    // if (isPdpMainProductAttach && isPdpMainProductAttach.insideOnly === false) {

    var mount = findOutsidePlacementMount(container, productSlug);
    if (mount) {
      var slotGroups = {};
      for (var gi = 0; gi < outsideIds.length; gi++) {
        var ogid = outsideIds[gi];
        var oglb = labelsById[ogid];
        if (!oglb) continue;
        var sl = getBadgeOutsideSlot(oglb);
        if (!slotGroups[sl]) slotGroups[sl] = [];
        slotGroups[sl].push(ogid);
      }
      for (var si = 0; si < BADGE_OUTSIDE_SLOTS.length; si++) {
        var slotKey = BADGE_OUTSIDE_SLOTS[si];
        var ids = slotGroups[slotKey];
        if (!ids || !ids.length) continue;
        var strip = buildOutsideStrip(
          ids,
          labelsById,
          sizeKey,
          slotKey,
          map,
          productSlug
        );
        if (strip) insertOutsideStrip(mount, slotKey, strip);
      }
    } else {
      var stripFb = document.createElement("div");
      stripFb.setAttribute(OUTSIDE_STRIP_ATTR, "true");
      stripFb.style.cssText = "position:relative;width:100%;min-height:0;";
      var fbLb0 = labelsById[outsideIds[0]];
      var fbMargin =
        fbLb0 && fbLb0.shapeSize && fbLb0.shapeSize.margin
          ? fbLb0.shapeSize.margin
          : DEFAULT_MARGIN;
      applyOutsideStripFlowMargins(stripFb, fbMargin);
      container.appendChild(stripFb);
      appendBadges(outsideIds, stripFb, "append", {
        outsideLayout: true,
        outsideStripInline: false,
      });
    }
  }
}

function attachProductPageOutsideLabels(map, pageKey, sizeKey, pdpSlug) {
  var labelsById = map.labelsById;
  var productSlugToLabelIds = map.productSlugToLabelIds;
  var defaultLabelIds = map.defaultLabelIds;

  var labelIdsForProduct =
    pdpSlug && productSlugToLabelIds[pdpSlug]
      ? productSlugToLabelIds[pdpSlug].slice()
      : defaultLabelIds.slice();

  labelIdsForProduct = labelIdsForProduct.filter(function (lid) {
    var lb = labelsById[lid];
    return lb && labelAllowedOnPage(lb, pageKey);
  });
  labelIdsForProduct.sort(function (a, b) {
    return comparePriority(a, b, labelsById);
  });
  if (labelIdsForProduct.length === 0) return;

  var outsideIds = [];
  for (var pj = 0; pj < labelIdsForProduct.length; pj++) {
    var plid = labelIdsForProduct[pj];
    var plb = labelsById[plid];
    if (!plb) continue;
    if (isOutsidePlacement(plb)) outsideIds.push(plid);
  }
  if (outsideIds.length === 0) return;

  var mount = findProductPageOutsidePlacementMount(pdpSlug);
  if (!mount || !mount.link) return;
  if (mount.link.hasAttribute(dataLabelAttached)) return;

  mount.link.setAttribute(dataLabelAttached, "true");

  var slotGroups = {};
  for (var gi = 0; gi < outsideIds.length; gi++) {
    var ogid = outsideIds[gi];
    var oglb = labelsById[ogid];
    if (!oglb) continue;
    var sl = getBadgeOutsideSlot(oglb);
    if (!slotGroups[sl]) slotGroups[sl] = [];
    slotGroups[sl].push(ogid);
  }
  for (var si = 0; si < BADGE_OUTSIDE_SLOTS.length; si++) {
    var slotKey = BADGE_OUTSIDE_SLOTS[si];
    var ids = slotGroups[slotKey];
    if (!ids || !ids.length) continue;
    var strip = buildOutsideStrip(
      ids,
      labelsById,
      sizeKey,
      slotKey,
      map,
      pdpSlug
    );
    if (strip) insertOutsideStrip(mount, slotKey, strip);
  }
}

function detachAllRibbons() {
  try {
    document.querySelectorAll("." + ribbonClass).forEach(function (b) {
      b.remove();
    });
    document
      .querySelectorAll("[" + OUTSIDE_STRIP_ATTR + "]")
      .forEach(function (s) {
        s.remove();
      });
    document.querySelectorAll("[" + PDP_SLOT_ATTR + "]").forEach(function (sl) {
      sl.remove();
    });
    document
      .querySelectorAll(".wix-custom-ribbon-outside-before-row")
      .forEach(function (row) {
        var parent = row.parentNode;
        if (!parent) return;
        while (row.firstChild) {
          parent.insertBefore(row.firstChild, row);
        }
        row.remove();
      });
    document
      .querySelectorAll("[" + OUTSIDE_AFTER_ROW_ATTR + "]")
      .forEach(function (row) {
        var parent = row.parentNode;
        if (!parent) return;

        if (
          row.getAttribute(OUTSIDE_AFTER_KIND_ATTR) ===
          OUTSIDE_AFTER_KIND_TITLE_FULL
        ) {
          var nm = row.querySelector('[data-hook="product-item-name"]');
          var nameCol = row.nextElementSibling;
          if (nm && nameCol) {
            var sinkTitle = nameCol.firstElementChild || nameCol;
            if (sinkTitle && !sinkTitle.contains(nm)) sinkTitle.appendChild(nm);
          }
          row.remove();
          return;
        }

        if (
          row.getAttribute(OUTSIDE_AFTER_KIND_ATTR) ===
          OUTSIDE_AFTER_KIND_PRICE_FULL
        ) {
          var pc = row.querySelector('[data-hook="prices-container"]');
          var priceCol = row.previousElementSibling;
          if (pc && priceCol) {
            /* Re-mount inside the price column without Wix-specific class names. */
            var sink = priceCol.firstElementChild || priceCol;
            if (sink && !sink.contains(pc)) sink.appendChild(pc);
          }
          row.remove();
          return;
        }

        var first = row.firstElementChild;
        if (first) parent.insertBefore(first, row);
        row.remove();
      });
    document
      .querySelectorAll("[" + dataLabelAttached + "]")
      .forEach(function (el) {
        el.removeAttribute(dataLabelAttached);
      });
    document.querySelectorAll("[" + PDP_ROW_ATTR + "]").forEach(function (el) {
      el.removeAttribute(PDP_ROW_ATTR);
    });
  } catch (e) {}
}

export function run(map, reason) {
  if (reason && reason !== "initial") logRerender(reason);
  var pageKey = getDisplayPageKey();
  var sizeKey = sizeKeyForContext(pageKey);
  /* On PDP, grid cards (e.g. related / you may also like) are catalog-style tiles — use collection sizes. */
  var listingSizeKey =
    pageKey === "productPage" ? sizeKeyForContext("collectionPage") : sizeKey;
  var containers = getProductContainers();
  for (var i = 0; i < containers.length; i++) {
    attachLabels(containers[i], map, pageKey, listingSizeKey);
  }
  if (pageKey === "productPage") {
    var pdpSlug = getProductPageSlugFromLocation();
    if (pdpSlug) {
      var pdpInside = getProductPageMainGalleryInsideContainers();
      for (var g = 0; g < pdpInside.length; g++) {
        attachLabels(pdpInside[g], map, pageKey, sizeKey, {
          productSlug: pdpSlug,
        });
      }
      attachProductPageOutsideLabels(map, pageKey, sizeKey, pdpSlug);
    }
  }
}

export function setupObservers(map) {
  var mq = window.matchMedia("(max-width: " + MOBILE_MAX_PX + "px)");
  function onBreakpointChange() {
    detachAllRibbons();
    run(map, "breakpoint-change");
  }
  if (mq.addEventListener) mq.addEventListener("change", onBreakpointChange);
  else if (mq.addListener) mq.addListener(onBreakpointChange);

  /**
   * Keep observer incremental and fast:
   * - ignore generic DOM churn
   * - react immediately when product targets are added or ribbon nodes are removed
   */
  var observer = null;
  var rafScheduled = false;
  var bootstrapTimer = null;
  var bootstrapStartedAt = Date.now();
  var BOOTSTRAP_WINDOW_MS = 400;
  var BOOTSTRAP_INTERVAL_MS = 50;

  function isRibbonArtifactNode(node) {
    if (!node || node.nodeType !== 1) return false;
    var el = /** @type {Element} */ (node);
    if (
      (el.classList && el.classList.contains(ribbonClass)) ||
      (el.hasAttribute && el.hasAttribute(OUTSIDE_STRIP_ATTR)) ||
      (el.hasAttribute && el.hasAttribute(PDP_SLOT_ATTR)) ||
      (el.hasAttribute && el.hasAttribute(OUTSIDE_AFTER_ROW_ATTR))
    ) {
      return true;
    }
    return false;
  }

  function nodeContainsRelevantProductTargets(node) {
    if (!node || node.nodeType !== 1) return false;
    var el = /** @type {Element} */ (node);
    if (isRibbonArtifactNode(el)) return false;

    var selector =
      '[data-hook="product-item-container"],' +
      '[data-hook="image-item"],' +
      '[data-hook="gallery-column"],' +
      '[data-hook="product-item-name-and-price-layout"],' +
      '[data-hook="product-item-name"],' +
      '[data-hook="prices-container"],' +
      '[data-hook="not-image-container"]';

    if (el.matches && el.matches(selector)) return true;
    return !!(el.querySelector && el.querySelector(selector));
  }

  function shouldReactToMutations(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (!m || m.type !== "childList") continue;
      var added = m.addedNodes;
      var removed = m.removedNodes;
      if (added && added.length) {
        for (var j = 0; j < added.length; j++) {
          if (nodeContainsRelevantProductTargets(added[j])) return true;
        }
      }
      if (removed && removed.length) {
        for (var r = 0; r < removed.length; r++) {
          var rn = removed[r];
          if (!rn || rn.nodeType !== 1) continue;
          var rel = /** @type {Element} */ (rn);
          if (
            isRibbonArtifactNode(rel) ||
            (rel.querySelector &&
              (rel.querySelector("." + ribbonClass) ||
                rel.querySelector("[" + OUTSIDE_STRIP_ATTR + "]") ||
                rel.querySelector("[" + PDP_SLOT_ATTR + "]")))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function scheduleRunNextFrame(reason) {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(function () {
      rafScheduled = false;
      if (observer) observer.disconnect();
      run(map, reason || "mutation");
      queueMicrotask(function () {
        if (observer && document.body)
          observer.observe(document.body, { childList: true, subtree: true });
      });
    });
  }

  function hasAnyAttachedRibbons() {
    return !!document.querySelector("." + ribbonClass);
  }

  function startBootstrapAttachWindow() {
    function tick() {
      if (Date.now() - bootstrapStartedAt > BOOTSTRAP_WINDOW_MS) return;
      scheduleRunNextFrame("bootstrap");
      if (hasAnyAttachedRibbons()) return;
      bootstrapTimer = setTimeout(tick, BOOTSTRAP_INTERVAL_MS);
    }
    tick();
  }

  observer = new MutationObserver(function (mutations) {
    if (!shouldReactToMutations(mutations)) return;
    scheduleRunNextFrame("mutation");
  });
  observer.observe(document.body, { childList: true, subtree: true });
  startBootstrapAttachWindow();
}
