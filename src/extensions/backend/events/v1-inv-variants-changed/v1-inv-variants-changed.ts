import { inventory } from "@wix/stores";
import {
  inventoryVariantsEventHasInventoryDiff,
  reevaluateLabelsForV1InventoryItem,
} from "../webhooks/v1HandlersShared";

export default inventory.onInventoryVariantsChanged(async (event) => {
  if (!inventoryVariantsEventHasInventoryDiff(event)) return;

  const productId = event.data?.productId;
  const inventoryItemId = event.data?.inventoryItemId;
  if (!productId || !inventoryItemId) return;

  await reevaluateLabelsForV1InventoryItem(productId, inventoryItemId);
});
