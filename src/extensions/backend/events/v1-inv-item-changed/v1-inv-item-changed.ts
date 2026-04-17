import { inventory } from "@wix/stores";
import { reevaluateLabelsForV1InventoryItem } from "../webhooks/v1HandlersShared";

export default inventory.onInventoryItemChanged(async (event) => {
  const productId = event.data?.productId;
  const inventoryItemId = event.data?.inventoryItemId;
  if (!productId || !inventoryItemId) return;

  await reevaluateLabelsForV1InventoryItem(productId, inventoryItemId);
});
