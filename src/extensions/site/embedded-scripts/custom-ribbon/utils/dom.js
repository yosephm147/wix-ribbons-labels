export var PRIMARY_SELECTOR = '[data-hook="product-item-container"]';

/**
 * Pro Gallery on product detail pages: horizontal column that holds the main image(s).
 * Catalog / grid product tiles do not use this for the main attach point — those use {@link PRIMARY_SELECTOR}.
 */
export var GALLERY_COLUMN_SELECTOR = '[data-hook="gallery-column"]';

export var PRODUCT_PAGE_MAIN_IMAGE_SELECTOR = '[data-hook="image-item"]';

export var ribbonClass = "wix-custom-ribbon-badge";
export var wrapperClass = "wix-custom-ribbon-wrapper";
export var dataLabelAttached = "data-wix-label-attached";
export var OUTSIDE_STRIP_ATTR = "data-wix-label-outside-strip";

/** Slug segment for the current PDP from `location.pathname` (no `data-slug` on main gallery). */
export function getProductPageSlugFromLocation() {
  var path =
    typeof location !== "undefined" && location.pathname
      ? location.pathname
      : "";
  var m = path.match(/\/(?:store\/product|product-page|product)\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Resolves the product URL slug from a catalog card / link (same segment as store product page path). */
export function getProductSlug(container) {
  var href = null;
  if (container.tagName && String(container.tagName).toLowerCase() === "a")
    href = container.getAttribute("href");
  if (!href && container.querySelector) {
    var link = container.querySelector(
      'a[href*="/product/"], a[href*="/store/product/"], a[href*="/product-page/"]'
    );
    if (link) href = link.getAttribute("href");
  }
  if (href) {
    var path = href;
    try {
      path = new URL(href, document.baseURI).pathname || href;
    } catch (e) {}
    var m = path.match(/\/(?:store\/product|product-page|product)\/([^/?#]+)/);
    if (m) return m[1];
  }
  if (container.getAttribute && container.getAttribute("data-product-id"))
    return container.getAttribute("data-product-id");
  if (container.getAttribute && container.getAttribute("data-id"))
    return container.getAttribute("data-id");
  return null;
}

export function getProductContainers() {
  var nodes = document.querySelectorAll(PRIMARY_SELECTOR);
  if (nodes.length === 0) {
    return [];
  }
  var list = Array.prototype.slice.call(nodes);
  var seenPid = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var el = list[i];
    var slug = getProductSlug(el);
    if (slug != null && slug !== "") {
      if (seenPid[slug]) continue;
      seenPid[slug] = true;
    }
    out.push(el);
  }
  return out;
}

/**
 * Catalog / search / related grid cards (has slug + not-image-container). PDP main gallery is outside this subtree.
 */
export function isInsideProductListingCard(el) {
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest(PRIMARY_SELECTOR);
}

/**
 * PDP “inside” badge targets: main Pro Gallery column(s), excluding galleries nested inside catalog cards.
 * Used from {@link run} on product pages together with {@link getProductPageSlugFromLocation}.
 * @returns {Element[]}
 */
export function getProductPageMainGalleryInsideContainers() {
  var nodes = document.querySelectorAll(PRODUCT_PAGE_MAIN_IMAGE_SELECTOR);
  var out = [];
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (isInsideProductListingCard(el)) continue;
    out.push(el);
  }
  return out;
}

/**
 * For outside badges: product card root → not-image-container → details link → name/price hooks.
 * @returns {{ root: Element, link: Element, nameEl: Element|null, priceEl: Element|null, layout: Element|null }|null}
 */
function commonAncestor(a, b) {
  if (!a || !b) return null;
  var chain = [];
  for (var n = a; n; n = n.parentElement) chain.push(n);
  for (var m = b; m; m = m.parentElement) {
    if (chain.indexOf(m) !== -1) return m;
  }
  return null;
}

/** Smallest element under `ceiling` that contains both `a` and `b` (typically title + price column). */
function narrowSharedLayout(a, b, ceiling) {
  if (!a || !b || !ceiling) return null;
  var ca = commonAncestor(a, b);
  if (!ca || !ceiling.contains(ca)) return ca;
  if (ca !== ceiling) return ca;
  var n = a;
  while (n && n !== ceiling) {
    if (n.contains(b) && n !== b) return n;
    n = n.parentElement;
  }
  return ca;
}

/** First match for `selector` that is not inside a catalog product card (PDP / main column). */
export function queryProductPageScoped(selector) {
  var list = document.querySelectorAll(selector);
  for (var i = 0; i < list.length; i++) {
    var el = list[i];
    if (!isInsideProductListingCard(el)) return el;
  }
  return null;
}

/**
 * First match for `selector` inside `root` that is not in a listing card and is contained by `root`.
 */
export function queryWithinPdpRegion(root, selector) {
  if (!root || !root.querySelectorAll) return null;
  var list = root.querySelectorAll(selector);
  for (var i = 0; i < list.length; i++) {
    var el = list[i];
    if (isInsideProductListingCard(el)) continue;
    if (!root.contains(el)) continue;
    return el;
  }
  return null;
}

/**
 * Section / mesh that contains the **main** PDP gallery (not header, not related-product grids).
 * Prefer {@link GALLERY_COLUMN_SELECTOR}; fall back to main image → gallery column → section.
 */
export function getProductPageMainDetailsRegionRoot() {
  var galleryCol = queryProductPageScoped(GALLERY_COLUMN_SELECTOR);
  if (galleryCol) {
    var sec = galleryCol.closest("section");
    if (sec) return sec;
    var mesh = galleryCol.closest('[data-testid="mesh-container-content"]');
    if (mesh) return mesh;
    return null;
  }
  var img = queryProductPageScoped(PRODUCT_PAGE_MAIN_IMAGE_SELECTOR);
  if (img) {
    var gc =
      typeof img.closest === "function"
        ? img.closest(GALLERY_COLUMN_SELECTOR)
        : null;
    if (gc) {
      var sec2 = gc.closest("section");
      if (sec2) return sec2;
    }
    var sec3 = img.closest("section");
    if (sec3) return sec3;
  }
  return null;
}

/**
 * Title / price / layout region for **outside** badges on a product detail page (no `data-slug` card).
 * Scoped to the same block as the main gallery so we never grab the site `h1` or another section.
 * @returns {{ root: Element, link: Element, nameEl: Element|null, priceEl: Element|null, layout: Element|null }|null}
 */
export function findProductPageOutsidePlacementMount(slug) {
  if (!slug) return null;

  var region = getProductPageMainDetailsRegionRoot();
  if (!region) return null;

  var layout = queryWithinPdpRegion(
    region,
    '[data-hook="product-item-name-and-price-layout"]'
  );
  var nameEl = null;
  var priceEl = null;
  if (layout) {
    nameEl = layout.querySelector('[data-hook="product-item-name"]');
    priceEl = layout.querySelector('[data-hook="prices-container"]');
  }
  if (!nameEl)
    nameEl = queryWithinPdpRegion(region, '[data-hook="product-item-name"]');
  if (!nameEl) {
    nameEl = queryWithinPdpRegion(region, ".wixui-rich-text h1");
  }
  if (!nameEl) {
    nameEl = queryWithinPdpRegion(region, "h1");
  }
  if (!priceEl)
    priceEl = queryWithinPdpRegion(region, '[data-hook="prices-container"]');
  if (!priceEl) {
    var pw = queryWithinPdpRegion(region, ".wixui-product-prices-wrapper");
    if (pw) {
      priceEl =
        pw.querySelector('[data-hook="prices-container"]') ||
        pw.querySelector('.wixui-rich-text[data-testid="richTextElement"]') ||
        pw;
    }
  }
  if (!nameEl || !priceEl) return null;
  if (!region.contains(nameEl) || !region.contains(priceEl)) return null;

  if (layout && (!layout.contains(nameEl) || !layout.contains(priceEl))) {
    layout = null;
  }

  if (!layout) {
    layout = narrowSharedLayout(nameEl, priceEl, region);
    if (!layout) return null;
    if (
      layout === document.body ||
      layout === document.documentElement ||
      !region.contains(layout)
    ) {
      return null;
    }
  }

  var link = layout;
  return {
    root: layout,
    link: link,
    nameEl: nameEl,
    priceEl: priceEl,
    layout: layout,
  };
}

export function findOutsidePlacementMount(container, slug) {
  if (!container || !slug) return null;
  var root =
    typeof container.closest === "function"
      ? container.closest("[data-slug]")
      : null;
  if (!root) return null;
  var attrSlug = root.getAttribute("data-slug");
  if (
    attrSlug != null &&
    slug != null &&
    String(attrSlug).toLowerCase() !== String(slug).toLowerCase()
  ) {
    return null;
  }
  var nic = root.querySelector('[data-hook="not-image-container"]');
  if (!nic) return null;
  var link =
    nic.querySelector('a[data-hook="product-item-product-details-link"]') ||
    nic.querySelector('a[href*="/product/"]') ||
    nic.querySelector("a");
  if (!link) return null;
  var nameEl = link.querySelector('[data-hook="product-item-name"]');
  var priceEl = link.querySelector('[data-hook="prices-container"]');
  var layout = link.querySelector(
    '[data-hook="product-item-name-and-price-layout"]'
  );
  return {
    root: nic,
    link: link,
    nameEl: nameEl,
    priceEl: priceEl,
    layout: layout,
  };
}

/** Direct child of `layout` that contains `el` (column block). */
export function getLayoutColumnChild(el, layout) {
  if (!el || !layout) return null;
  var n = el;
  while (n && n.parentElement && n.parentElement !== layout) {
    n = n.parentElement;
  }
  return n && n.parentElement === layout ? n : null;
}
