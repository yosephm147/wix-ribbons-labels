import { app } from "@wix/astro/builders";
import ribbons from "./extensions/dashboard/pages/ribbons.extension.ts";
import customRibbon from "./extensions/site/embedded-scripts/custom-ribbon/custom-ribbon.extension.ts";

import v1ProductCreated from "./extensions/backend/events/v1-product-created/v1-product-created.extension.ts";
import v1ProductDeleted from "./extensions/backend/events/v1-product-deleted/v1-product-deleted.extension.ts";
import v1ProductChanged from "./extensions/backend/events/v1-product-changed/v1-product-changed.extension.ts";
import v1InvItemChanged from "./extensions/backend/events/v1-inv-item-changed/v1-inv-item-changed.extension.ts";
import v1InvVariantsChanged from "./extensions/backend/events/v1-inv-variants-changed/v1-inv-variants-changed.extension.ts";
import v1ProductCollectionsDeleted from "./extensions/backend/events/v1-product-collections-deleted/v1-product-collections-deleted.extension.ts";

import v3ProductDeleted from "./extensions/backend/events/v3-product-deleted/v3-product-deleted.extension.ts";
import v3ProductUpdated from "./extensions/backend/events/v3-product-updated/v3-product-updated.extension.ts";
import v3InvItemUpdated from "./extensions/backend/events/v3-inv-item-updated/v3-inv-item-updated.extension.ts";
import v3CategoryDeleted from "./extensions/backend/events/v3-category-deleted/v3-category-deleted.extension.ts";

export default app()
  .use(ribbons)
  .use(customRibbon)
  .use(v1ProductCreated)
  .use(v1ProductDeleted)
  .use(v1ProductChanged)
  .use(v1InvItemChanged)
  .use(v1InvVariantsChanged)
  .use(v1ProductCollectionsDeleted)
  .use(v3ProductDeleted)
  .use(v3ProductUpdated)
  .use(v3InvItemUpdated)
  .use(v3CategoryDeleted);
