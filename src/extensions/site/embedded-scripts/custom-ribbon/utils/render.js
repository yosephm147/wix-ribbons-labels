import { ribbonClass } from "./dom.js";
import { labelFontCssStack } from "./labelFonts.js";

export var SVG_NS = "http://www.w3.org/2000/svg";

export var DEFAULT_MARGIN = { top: "0", right: "", bottom: "", left: "0" };

/** Cap at 100% text size — keep in sync with badgeShape.tsx BADGE_TEXT_MAX_FONT_FRACTION_OF_VH */
export var BADGE_TEXT_MAX_FONT_FRACTION_OF_VH = 0.85;

function normalizeMarginSide(v) {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    if (!isFinite(v)) return "";
    return v === 0 ? "" : String(v);
  }
  if (typeof v === "string") return v.trim();
  return "";
}

function normalizeMargin(m) {
  if (!m || typeof m !== "object") return DEFAULT_MARGIN;
  return {
    top: normalizeMarginSide(m.top),
    right: normalizeMarginSide(m.right),
    bottom: normalizeMarginSide(m.bottom),
    left: normalizeMarginSide(m.left),
  };
}

function parseMarginPx(s) {
  if (s == null || s === "") return null;
  var n = parseFloat(String(s).trim());
  return isFinite(n) ? n : null;
}

export var SHAPE_DEFAULTS = {
  rectangle: { width: 80, height: 32 },
  "rounded-rectangle": { width: 80, height: 32 },
  circle: { width: 56, height: 56 },
  starburst: { width: 64, height: 64 },
  "right-notch-flat": { width: 80, height: 32 },
  "left-notch-flat": { width: 80, height: 32 },
  "arrow-right": { width: 80, height: 32 },
  "arrow-left": { width: 80, height: 32 },
  "double-arrow": { width: 80, height: 32 },
  "diagonal-slash": { width: 100, height: 16 },
  "diagonal-slash-flipped": { width: 80, height: 16 },
  "diagonal-slash-round": { width: 100, height: 20 },
  "diagonal-slash-round-rotated": { width: 100, height: 20 },
  "corner-tr": { width: 56, height: 56 },
  "corner-tl": { width: 56, height: 56 },
  trapezoid: { width: 80, height: 32 },
  "trapezoid-inv": { width: 80, height: 32 },
  bowtie: { width: 80, height: 32 },
  "concave-right": { width: 80, height: 32 },
  "concave-left": { width: 80, height: 32 },
  hexagon: { width: 64, height: 56 },
  diamond: { width: 64, height: 64 },
  ribbon: { width: 80, height: 32 },
  "wide-chevron": { width: 80, height: 32 },
};

export var TEXT_OVERRIDES = {
  "corner-tr": {
    x: function (w) {
      return w * 0.67;
    },
    y: function (w, h) {
      return h * 0.33;
    },
    rotate: 45,
  },
  "corner-tl": {
    x: function (w) {
      return w * 0.33;
    },
    y: function (w, h) {
      return h * 0.67;
    },
    rotate: 45,
  },
  "right-notch-flat": {
    x: function (w) {
      return w * 0.55;
    },
    y: function (w, h) {
      return h * 0.5;
    },
    rotate: 0,
  },
  "left-notch-flat": {
    x: function (w) {
      return w * 0.45;
    },
    y: function (w, h) {
      return h * 0.5;
    },
    rotate: 0,
  },
  "arrow-right": {
    x: function (w) {
      return w * 0.45;
    },
    y: function (w, h) {
      return h * 0.5;
    },
    rotate: 0,
  },
  "arrow-left": {
    x: function (w) {
      return w * 0.55;
    },
    y: function (w, h) {
      return h * 0.5;
    },
    rotate: 0,
  },
  "concave-left": {
    x: function (w) {
      return w * 0.52;
    },
    y: function (w, h) {
      return h * 0.5;
    },
    rotate: 0,
  },
  "concave-right": {
    x: function (w) {
      return w * 0.48;
    },
    y: function (w, h) {
      return h * 0.5;
    },
    rotate: 0,
  },
};

function starburstPathD(w, h) {
  var cx = w / 2,
    cy = h / 2,
    outerRx = w * 0.45,
    outerRy = h * 0.45,
    ctrlFactor = 1.25,
    n = 16,
    startAngle = -Math.PI / 2,
    d = "";
  for (var i = 0; i < n; i++) {
    var angle = startAngle + (i * 2 * Math.PI) / n;
    var x = cx + outerRx * Math.cos(angle),
      y = cy + outerRy * Math.sin(angle);
    if (i === 0) d += "M" + x.toFixed(2) + "," + y.toFixed(2);
    var midAngle = startAngle + ((i + 0.5) * 2 * Math.PI) / n;
    var cpx = cx + outerRx * ctrlFactor * Math.cos(midAngle),
      cpy = cy + outerRy * ctrlFactor * Math.sin(midAngle);
    var nextAngle = startAngle + ((i + 1) * 2 * Math.PI) / n;
    var nx = cx + outerRx * Math.cos(nextAngle),
      ny = cy + outerRy * Math.sin(nextAngle);
    d +=
      " Q" +
      cpx.toFixed(2) +
      "," +
      cpy.toFixed(2) +
      " " +
      nx.toFixed(2) +
      "," +
      ny.toFixed(2);
  }
  return d + " Z";
}

export function svgEl(name, attrs) {
  var e = document.createElementNS(SVG_NS, name);
  if (attrs) {
    for (var k in attrs) {
      if (attrs[k] != null) e.setAttribute(k, String(attrs[k]));
    }
  }
  return e;
}

function diagonalSlashRoundPath(w, h, rotated) {
  var X = function (n) {
    return ((n - 2) / 36) * w;
  };
  var Y = function (n) {
    return ((n - 9) / 10) * h;
  };
  if (!rotated) {
    return (
      "M " +
      X(6.7) +
      "," +
      Y(11.1) +
      " Q " +
      X(8) +
      "," +
      Y(9) +
      " " +
      X(10.5) +
      "," +
      Y(9) +
      " L " +
      X(35.5) +
      "," +
      Y(9) +
      " Q " +
      X(38) +
      "," +
      Y(9) +
      " " +
      X(36.7) +
      "," +
      Y(11.1) +
      " L " +
      X(33.3) +
      "," +
      Y(16.9) +
      " Q " +
      X(32) +
      "," +
      Y(19) +
      " " +
      X(29.5) +
      "," +
      Y(19) +
      " L " +
      X(4.5) +
      "," +
      Y(19) +
      " Q " +
      X(2) +
      "," +
      Y(19) +
      " " +
      X(3.3) +
      "," +
      Y(16.9) +
      " Z"
    );
  }
  return (
    "M " +
    X(33.3) +
    "," +
    Y(11.1) +
    " Q " +
    X(32) +
    "," +
    Y(9) +
    " " +
    X(29.5) +
    "," +
    Y(9) +
    " L " +
    X(4.5) +
    "," +
    Y(9) +
    " Q " +
    X(2) +
    "," +
    Y(9) +
    " " +
    X(3.3) +
    "," +
    Y(11.1) +
    " L " +
    X(6.7) +
    "," +
    Y(16.9) +
    " Q " +
    X(8) +
    "," +
    Y(19) +
    " " +
    X(10.5) +
    "," +
    Y(19) +
    " L " +
    X(35.5) +
    "," +
    Y(19) +
    " Q " +
    X(38) +
    "," +
    Y(19) +
    " " +
    X(36.7) +
    "," +
    Y(16.9) +
    " Z"
  );
}

/** Path `d` for shapes that render as a single path (others use shapeSvgDirect). */
export var SHAPE_PATH_D = {
  starburst: function (w, h) {
    return starburstPathD(w, h);
  },
  "arrow-right": function (w, h) {
    var tip = Math.min(h * 0.8, w * 0.25);
    return (
      "M 0,0 L " +
      (w - tip) +
      ",0 L " +
      w +
      "," +
      h / 2 +
      " L " +
      (w - tip) +
      "," +
      h +
      " L 0," +
      h +
      " Z"
    );
  },
  "arrow-left": function (w, h) {
    var tip = Math.min(h * 0.8, w * 0.25);
    return (
      "M " +
      tip +
      ",0 L " +
      w +
      ",0 L " +
      w +
      "," +
      h +
      " L " +
      tip +
      "," +
      h +
      " L 0," +
      h / 2 +
      " Z"
    );
  },
  "double-arrow": function (w, h) {
    var tip = Math.min(h * 0.8, w * 0.15);
    return (
      "M " +
      tip +
      ",0 L " +
      (w - tip) +
      ",0 L " +
      w +
      "," +
      h / 2 +
      " L " +
      (w - tip) +
      "," +
      h +
      " L " +
      tip +
      "," +
      h +
      " L 0," +
      h / 2 +
      " Z"
    );
  },
  "right-notch-flat": function (w, h) {
    var notch = h * 0.4;
    return (
      "M 0,0 L " +
      w +
      ",0 L " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " L " +
      notch +
      "," +
      h / 2 +
      " Z"
    );
  },
  "left-notch-flat": function (w, h) {
    var notch = h * 0.4;
    return (
      "M 0,0 L " +
      w +
      ",0 L " +
      (w - notch) +
      "," +
      h / 2 +
      " L " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " Z"
    );
  },
  "diagonal-slash": function (w, h) {
    return (
      "M " +
      w * 0.15 +
      ",0 L " +
      w * 0.85 +
      ",0  L " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " Z"
    );
  },
  "diagonal-slash-flipped": function (w, h) {
    return (
      "M 0,0 L " +
      w +
      ",0 L " +
      w * 0.85 +
      "," +
      h +
      " L " +
      w * 0.15 +
      "," +
      h +
      " Z"
    );
  },
  "diagonal-slash-round": function (w, h) {
    return diagonalSlashRoundPath(w, h, false);
  },
  "diagonal-slash-round-rotated": function (w, h) {
    return diagonalSlashRoundPath(w, h, true);
  },
  "corner-tr": function (w, h) {
    return "M 0,0 L " + w + ",0 L " + w + "," + h + " Z";
  },
  "corner-tl": function (w, h) {
    return "M 0,0 L 0," + h + " L " + w + "," + h + " Z";
  },
  trapezoid: function (w, h) {
    var o = w * 0.1;
    return (
      "M " + o + ",0 L " + (w - o) + ",0 L " + w + "," + h + " L 0," + h + " Z"
    );
  },
  "trapezoid-inv": function (w, h) {
    var o = w * 0.1;
    return (
      "M 0,0 L " + w + ",0 L " + (w - o) + "," + h + " L " + o + "," + h + " Z"
    );
  },
  bowtie: function (w, h) {
    var m = w * 0.25;
    return (
      "M 0,0 L " +
      w +
      ",0 L " +
      (w - m) +
      "," +
      h / 2 +
      " L " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " L " +
      m +
      "," +
      h / 2 +
      " Z"
    );
  },
  "concave-right": function (w, h) {
    var cr = w * 0.15;
    return (
      "M 0,0 L " +
      w +
      ",0 Q " +
      (w - cr) +
      "," +
      h / 2 +
      " " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " Z"
    );
  },
  "concave-left": function (w, h) {
    var cl = w * 0.15;
    return (
      "M 0,0 L " +
      w +
      ",0 L " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " Q " +
      cl +
      "," +
      h / 2 +
      " 0,0 Z"
    );
  },
  hexagon: function (w, h) {
    return (
      "M " +
      w * 0.25 +
      ",0 L " +
      w * 0.75 +
      ",0 L " +
      w +
      "," +
      h / 2 +
      " L " +
      w * 0.75 +
      "," +
      h +
      " L " +
      w * 0.25 +
      "," +
      h +
      " L 0," +
      h / 2 +
      " Z"
    );
  },
  diamond: function (w, h) {
    return (
      "M " +
      w / 2 +
      ",0 L " +
      w +
      "," +
      h / 2 +
      " L " +
      w / 2 +
      "," +
      h +
      " L 0," +
      h / 2 +
      " Z"
    );
  },
  ribbon: function (w, h) {
    var c = w * 0.15;
    return (
      "M 0,0 L " +
      w +
      ",0 Q " +
      (w - c) +
      "," +
      h / 2 +
      " " +
      w +
      "," +
      h +
      " L 0," +
      h +
      " Q " +
      c +
      "," +
      h / 2 +
      " 0,0 Z"
    );
  },
  "wide-chevron": function (w, h) {
    var wm = w * 0.15;
    return (
      "M 0,0 L " +
      (w - wm) +
      ",0 L " +
      w +
      "," +
      h / 2 +
      " L " +
      (w - wm) +
      "," +
      h +
      " L 0," +
      h +
      " L " +
      wm +
      "," +
      h / 2 +
      " Z"
    );
  },
};

/** Shapes that append rect/ellipse directly (not path). */
export var shapeSvgDirect = {
  rectangle: function (svg, w, h, fill, op) {
    svg.appendChild(
      svgEl("rect", {
        width: w,
        height: h,
        fill: fill || "none",
        opacity: op,
      })
    );
  },
  "rounded-rectangle": function (svg, w, h, fill, op) {
    var r = Math.min(w, h) * 0.25;
    svg.appendChild(
      svgEl("rect", {
        width: w,
        height: h,
        rx: r,
        ry: r,
        fill: fill || "none",
        opacity: op,
      })
    );
  },
  circle: function (svg, w, h, fill, op) {
    svg.appendChild(
      svgEl("ellipse", {
        cx: w / 2,
        cy: h / 2,
        rx: w / 2,
        ry: h / 2,
        fill: fill || "none",
        opacity: op,
      })
    );
  },
};

export function appendBadgeShape(svg, shape, w, h, fill) {
  var op = fill ? "1" : "0";
  var f = fill || "none";
  var direct = shapeSvgDirect[shape];
  if (direct) {
    direct(svg, w, h, f, op);
    return;
  }
  var pathFn = SHAPE_PATH_D[shape];
  var d = pathFn ? pathFn(w, h) : null;
  if (d) svg.appendChild(svgEl("path", { d: d, fill: f, opacity: op }));
  else shapeSvgDirect.rectangle(svg, w, h, f, op);
}

export function appendBadgeSvgText(
  svg,
  label,
  shape,
  vw,
  vh,
  variables,
  renderedWidth,
  renderedHeight
) {
  var o = TEXT_OVERRIDES[shape];
  var textX = o ? o.x(vw, vh) : vw / 2;
  var textY = o ? o.y(vw, vh) : vh / 2;
  var textRotate = o ? o.rotate : 0;
  var t0 = label.text || {};
  var labelRaw = t0.message != null ? String(t0.message) : "<b>SALE</b>";
  var isBold = labelRaw.indexOf("<b>") !== -1;
  var isUnderline = labelRaw.indexOf("<u>") !== -1;
  var isItalic = labelRaw.indexOf("<i>") !== -1;
  var align =
    labelRaw.indexOf('style="text-align: left;"') !== -1
      ? "end"
      : labelRaw.indexOf('style="text-align: right;"') !== -1
      ? "start"
      : "middle";
  var plain = labelRaw.replace(/<[^>]*>/g, "").trim();
  if (variables && typeof variables === "object") {
    plain = plain.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (full, key) {
      var value = variables[key];
      return value == null ? full : String(value);
    });
  }
  var t = t0;
  var fontSize =
    (vh * (t.size != null ? t.size : 20) * BADGE_TEXT_MAX_FONT_FRACTION_OF_VH) /
    100;
  var textEl = svgEl("text", {
    x: textX,
    y: textY,
    "text-anchor": o ? "middle" : align,
    "dominant-baseline": "central",
    fill: t.color || "#000000",
    "font-size": fontSize,
    "font-weight": isBold ? "bold" : "normal",
    "text-decoration": isUnderline ? "underline" : "none",
    "font-style": isItalic ? "italic" : "normal",
    "font-family": labelFontCssStack(t.font),
    "letter-spacing": t.letterSpacing != null ? t.letterSpacing : 0,
  });
  textEl.textContent = plain;
  var textScaleX = 1;
  if (
    renderedWidth != null &&
    renderedHeight != null &&
    renderedWidth > 0 &&
    renderedHeight > 0
  ) {
    textScaleX = (renderedHeight * vw) / (renderedWidth * vh);
  }
  var transforms = [];
  if (Math.abs(textScaleX - 1) > 0.001) {
    transforms.push(
      "translate(" +
        textX +
        " " +
        textY +
        ") scale(" +
        textScaleX +
        " 1) translate(" +
        -textX +
        " " +
        -textY +
        ")"
    );
  }
  if (textRotate !== 0)
    transforms.push("rotate(" + textRotate + ", " + textX + ", " + textY + ")");
  if (transforms.length) textEl.setAttribute("transform", transforms.join(" "));
  svg.appendChild(textEl);
}

function marginsToCssStyle(margin, stackOffsetPx) {
  var m = normalizeMargin(margin || DEFAULT_MARGIN);
  var stack = stackOffsetPx || 0;
  var topPx = parseMarginPx(m.top);
  var bottomPx = parseMarginPx(m.bottom);
  var leftPx = parseMarginPx(m.left);
  var rightPx = parseMarginPx(m.right);
  var style = {};
  if (topPx !== null) style.top = topPx + stack + "px";
  else if (bottomPx !== null) style.bottom = bottomPx + stack + "px";
  else style.top = "50%";
  if (leftPx !== null) style.left = leftPx + "px";
  else if (rightPx !== null) style.right = rightPx + "px";
  else style.left = "50%";
  var transforms = [];
  if (topPx === null && bottomPx === null)
    transforms.push("translateY(calc(-50% + " + stack + "px))");
  if (leftPx === null && rightPx === null) transforms.push("translateX(-50%)");
  if (transforms.length) style.transform = transforms.join(" ");
  return style;
}

/** Flex alignment for outside (non-absolute) badges from margin left/center/right presets. */
export function outsideJustifyFromMargin(margin) {
  var m = normalizeMargin(margin || DEFAULT_MARGIN);
  var leftPx = parseMarginPx(m.left);
  var rightPx = parseMarginPx(m.right);
  if (leftPx !== null && rightPx === null) return "flex-start";
  if (rightPx !== null && leftPx === null) return "flex-end";
  return "center";
}

/**
 * Outside-image strips: vertical margin vs adjacent blocks; horizontal inset as padding
 * (inner badge row flex alignment stays correct). Matches dashboard preview `outsideBadgeFlowBoxStyle`.
 * @param {HTMLElement} strip
 * @param {object} margin — normalized margin object
 */
export function applyOutsideStripFlowMargins(strip, margin) {
  if (!strip || !strip.style) return;
  var m = normalizeMargin(margin || DEFAULT_MARGIN);
  var topPx = parseMarginPx(m.top);
  var bottomPx = parseMarginPx(m.bottom);
  var leftPx = parseMarginPx(m.left);
  var rightPx = parseMarginPx(m.right);
  if (topPx !== null) strip.style.marginTop = topPx + "px";
  if (bottomPx !== null) strip.style.marginBottom = bottomPx + "px";
  if (leftPx !== null) strip.style.paddingLeft = leftPx + "px";
  if (rightPx !== null) strip.style.paddingRight = rightPx + "px";
}

export function getShapeSize(label, sizeKey) {
  var ss = label.shapeSize || {};
  var s = ss[sizeKey];
  if (!s || typeof s.width !== "number")
    s = { width: 80, height: 32, unit: "px" };
  return {
    width: s.width,
    height: s.height,
    unit: s.unit === "%" ? "%" : "px",
  };
}

/**
 * @param {object} label — normalized label
 * @param {object} ctx — { sizeKey, anchorMargin, stackOffsetPx, outsideLayout?, outsideStripInline?, outsideStripAlignViaParent? }
 */
export function renderBadge(label, ctx) {
  var sizeKey = ctx.sizeKey;
  var stackOffsetPx = ctx.stackOffsetPx || 0;
  var anchorMargin = ctx.anchorMargin;
  var outsideLayout = ctx.outsideLayout === true;
  var outsideStripInline = ctx.outsideStripInline === true;
  var outsideStripAlignViaParent = ctx.outsideStripAlignViaParent === true;
  var size = getShapeSize(label, sizeKey);
  var w = size.width,
    h = size.height,
    unit = size.unit;
  var margin = anchorMargin || label.shapeSize.margin || DEFAULT_MARGIN;
  var pos = outsideLayout ? {} : marginsToCssStyle(margin, stackOffsetPx);
  var shape = label.shape || "rectangle";
  var nat = SHAPE_DEFAULTS[shape] || { width: 64, height: 32 };
  var vw = nat.width,
    vh = nat.height;
  var badge = document.createElement("div");
  badge.className = ribbonClass;
  badge.setAttribute("data-label-id", label.id);
  if (outsideLayout) badge.setAttribute("data-outside-layout", "true");
  var rotation = label.shapeSize.rotation || 0;
  if (!outsideLayout) {
    Object.assign(badge.style, pos);
  } else {
    badge.style.position = "relative";
    badge.style.top = "auto";
    badge.style.left = "auto";
    badge.style.right = "auto";
    badge.style.bottom = "auto";
    badge.style.transform = "none";
  }
  badge.style.minWidth = "24px";
  badge.style.backgroundColor = "transparent";
  var clip = document.createElement("div");
  clip.className = "wix-custom-ribbon-clip";
  if (unit === "%") {
    badge.style.width = w + "%";
    badge.style.aspectRatio = w + " / " + h;
  } else {
    badge.style.width = w + "px";
    badge.style.height = h + "px";
  }
  if (outsideLayout) {
    clip.className += " wix-custom-ribbon-clip--outside";
    clip.style.position = "relative";
    clip.style.boxSizing = "border-box";
    if (outsideStripAlignViaParent) {
      clip.style.display = "inline-flex";
      clip.style.flexDirection = "row";
      clip.style.alignItems = "center";
      clip.style.width = "auto";
      clip.style.maxWidth = "100%";
    } else {
      clip.style.display = outsideStripInline ? "inline-flex" : "flex";
      clip.style.flexDirection = "row";
      clip.style.alignItems = "center";
      clip.style.justifyContent = outsideJustifyFromMargin(margin);
      if (outsideStripInline) {
        clip.style.width = "auto";
        clip.style.maxWidth = "100%";
      } else {
        clip.style.width = "100%";
      }
    }
    clip.style.minHeight = h + "px";
    clip.style.height = "auto";
    if (stackOffsetPx) clip.style.marginTop = stackOffsetPx + "px";
    clip.style.overflow = label.shapeSize.overflowHidden ? "hidden" : "visible";
  } else {
    clip.style.width = "100%";
    clip.style.height = "100%";
    clip.style.position = "absolute";
    clip.style.boxSizing = "border-box";
    if (label.shapeSize.overflowHidden) clip.style.overflow = "hidden";
  }
  var svg = svgEl("svg", {
    width: "100%",
    height: "100%",
    viewBox: "0 0 " + vw + " " + vh,
    preserveAspectRatio: "none",
  });
  svg.style.display = "block";
  svg.style.overflow = "visible";
  if (rotation) {
    svg.style.transform = "rotate(" + rotation + "deg)";
    svg.style.transformOrigin = "center center";
  }
  appendBadgeShape(svg, shape, vw, vh, label.backgroundColor || undefined);
  appendBadgeSvgText(svg, label, shape, vw, vh, ctx.variables, w, h);
  badge.appendChild(svg);
  clip.appendChild(badge);
  return clip;
}
