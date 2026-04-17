import type { Label, ShapeSize } from "@/extensions/dashboard/pages/types";
import { SHAPE_DEFAULTS, getDefaultTextSizeForShape } from "@/utils/badgeShape";

const DEFAULT_SHAPE = "rectangle";

function defaultSizes(): Pick<
  Label["shapeSize"],
  | "desktop_collection"
  | "desktop_product"
  | "mobile_collection"
  | "mobile_product"
> {
  const { width, height } = SHAPE_DEFAULTS[DEFAULT_SHAPE] ?? {
    width: 64,
    height: 64,
  };
  const desk: ShapeSize = { width, height, unit: "px" };
  const mob: ShapeSize = {
    // width: Math.round(width * 0.75),
    // height: Math.round(height * 0.75),
    width: width,
    height: height,
    unit: "px",
  };
  return {
    desktop_collection: desk,
    desktop_product: desk,
    mobile_collection: mob,
    mobile_product: mob,
  };
}

export function createNewLabel(): Label {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    applyMode: "all",
    conditions: { operator: "AND", rules: [] },
    shape: DEFAULT_SHAPE,
    backgroundColor: "#E24B4B",
    shapeSize: {
      shapeSizeMode: "global",
      ...defaultSizes(),
      rotation: 0,
      margin: { top: "0", left: "0", bottom: "", right: "" },
      badgeImagePlacement: "inside",
      badgeOutsideSlot: "above_product_title",
      overflowHidden: true,
      autoAdjust: true,
    },
    text: {
      message: "<b>SALE</b>",
      color: "#000000",
      size: getDefaultTextSizeForShape(DEFAULT_SHAPE),
      letterSpacing: 0,
    },
    displayPages: {
      productPage: true,
      collectionPage: true,
      homePage: true,
      searchPage: true,
    },
  };
}
