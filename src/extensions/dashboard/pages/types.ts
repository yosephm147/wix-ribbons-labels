export type InventoryStatusValue =
  | "inStock"
  | "outOfStock"
  | "availableForPreorder";

export type WeightUnit = "lbs" | "kg";

/** Minimum discount threshold: percent off list, or absolute amount off (compare-at minus price). */
export type DiscountKind = "percent" | "amount";

export type ConditionRule =
  | { type: "productSlugs"; values: string[] }
  | { type: "categories"; values: string[] }
  | { type: "excludeCategories"; values: string[] }
  | { type: "priceRange"; min?: number; max?: number }
  | { type: "weightRange"; min?: number; max?: number; unit?: WeightUnit }
  | { type: "discount"; discountKind: DiscountKind; min?: number }
  | {
      type: "inventoryStatus";
      values: InventoryStatusValue[];
    }
  | {
      type: "inventoryQuantity";
      min?: number;
      max?: number;
    }
  | { type: "newStatus"; daysOld?: number }
  | { type: "includeProductSlugs"; values: string[] }
  | { type: "excludeProductSlugs"; values: string[] }
  | { type: "metafield"; key: string; value: string };

export type ConditionGroup = {
  operator: "AND" | "OR";
  rules: ConditionRule[];
};

export type ShapeSize = {
  width: number;
  height: number;
  unit: "px" | "%";
};

/** Per side: `""` = do not apply; any finite numeric string (e.g. `"0"`, `"-2"`, `"12"`) = px. */
export type MarginSettings = {
  top: string;
  right: string;
  bottom: string;
  left: string;
};

export const POSITION_OPTIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export type PositionKey = (typeof POSITION_OPTIONS)[number];

export const PREDEFINED_POSITION_MARGINS: Record<PositionKey, MarginSettings> =
  {
    "top-left": { top: "0", right: "", bottom: "", left: "0" },
    "top-center": { top: "0", right: "", bottom: "", left: "" },
    "top-right": { top: "0", right: "0", bottom: "", left: "" },
    "middle-left": { top: "", right: "", bottom: "", left: "0" },
    center: { top: "", right: "", bottom: "", left: "" },
    "middle-right": { top: "", right: "0", bottom: "", left: "" },
    "bottom-left": { top: "", right: "", bottom: "0", left: "0" },
    "bottom-center": { top: "", right: "", bottom: "0", left: "" },
    "bottom-right": { top: "", right: "0", bottom: "0", left: "" },
  };

/** Badge sits on the product media vs in a row below it (outside). */
export type BadgeImagePlacement = "inside" | "outside";

/** Horizontal row below the image; top/bottom margins default to `"0"`. */
export const OUTSIDE_POSITION_OPTIONS = ["left", "middle", "right"] as const;

export type OutsidePositionKey = (typeof OUTSIDE_POSITION_OPTIONS)[number];

export const OUTSIDE_PREDEFINED_POSITION_MARGINS: Record<
  OutsidePositionKey,
  MarginSettings
> = {
  left: { top: "", bottom: "", left: "0", right: "" },
  middle: { top: "", bottom: "", left: "", right: "" },
  right: { top: "", bottom: "", left: "", right: "0" },
};

/** Where the outside badge sits relative to product title / price (product & collection previews). */
export const BADGE_OUTSIDE_SLOT_IDS = [
  "above_product_title",
  "below_product_title",
  "before_product_title",
  "after_product_title",
  "above_product_price",
  "below_product_price",
  "before_product_price",
  "after_product_price",
] as const;

export type BadgeOutsideSlot = (typeof BADGE_OUTSIDE_SLOT_IDS)[number];

export const BADGE_OUTSIDE_SLOT_OPTIONS: {
  id: BadgeOutsideSlot;
  value: string;
}[] = [
  { id: "above_product_title", value: "Above product title" },
  { id: "below_product_title", value: "Below product title" },
  { id: "before_product_title", value: "Before product title" },
  { id: "after_product_title", value: "After product title" },
  { id: "above_product_price", value: "Above product price" },
  { id: "below_product_price", value: "Below product price" },
  { id: "before_product_price", value: "Before product price" },
  { id: "after_product_price", value: "After product price" },
];

export function normalizeBadgeOutsideSlot(raw: unknown): BadgeOutsideSlot {
  if (
    typeof raw === "string" &&
    (BADGE_OUTSIDE_SLOT_IDS as readonly string[]).includes(raw)
  ) {
    return raw as BadgeOutsideSlot;
  }
  return "above_product_title";
}

export type ApplyMode = "all" | "specific" | "conditions";

export type DisplayPages = {
  productPage: boolean;
  collectionPage: boolean;
  homePage: boolean;
  searchPage: boolean;
};

export const LABEL_VARIABLE_IDS = [
  "sale_amt",
  "sale_pct",
  "inventory_quantity",
  "min_price",
] as const;

export type LabelVariableId = (typeof LABEL_VARIABLE_IDS)[number];
export type LabelVariables = Partial<Record<LabelVariableId, number | string>>;

/** Per-slug values in labelIndex; `productId` is for delete webhooks, not {{}} tokens */
export type LabelIndexEntryVars = LabelVariables & {
  productId: string;
  newUntil?: string;
};

export type Label = {
  id: string;
  dev?: boolean;
  name?: string;
  enabled: boolean;
  priority?: number;
  applyMode: ApplyMode;
  conditions: ConditionGroup;
  shape: string;
  backgroundColor: string;
  shapeSize: {
    shapeSizeMode: "global" | "custom";
    desktop_collection: ShapeSize;
    desktop_product: ShapeSize;
    mobile_collection: ShapeSize;
    mobile_product: ShapeSize;
    margin: MarginSettings;
    /** Default `inside` — overlay on product image; `outside` — near title/price (`badgeOutsideSlot`). */
    badgeImagePlacement?: BadgeImagePlacement;
    /** When `badgeImagePlacement` is `outside`. Default first option: above product title. */
    badgeOutsideSlot?: BadgeOutsideSlot;
    rotation: number;
    overflowHidden: boolean;
    /** When true, changing width scales height to preserve aspect ratio (editor / size UX). */
    autoAdjust: boolean;
  };
  text: {
    message: string;
    color: string;
    size: number;
    letterSpacing: number;
    /**
     * Font preset id (`FONT_OPTIONS` in `@/utils/labelFonts`), or omit / leave unset to use the site theme font (`inherit`).
     */
    font?: string;
  };
  displayPages: DisplayPages;
};

export type LabelsConfig = {
  version: number;
  labels: Label[];
  /** labelId → productSlug → computed variables + productId, evaluated on save */
  labelIndex: Record<string, Record<string, LabelIndexEntryVars>>;
  /** labelIds applied to all products */
  defaultLabelIds: string[];
};
