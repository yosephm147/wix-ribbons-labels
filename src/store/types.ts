import type { InventoryStatusValue } from "@/extensions/dashboard/pages/types";

/** A product can carry several at once (e.g. preorder plus in stock or out of stock). */
export type NormalizedProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  categoryIds: string[];
  price: number | null;
  compareAtPrice: number | null;
  weight: number | null;
  weightUnit: string | null;
  inventoryStatus: InventoryStatusValue[] | null;
  inventoryQuantity: number | null;
  inventoryTracked: boolean | null;
  createdAt: Date | null;
};

export type SearchOption = {
  id: string;
  label: string;
  slug: string;
  imageUrl?: string;
};

export type ProductPreview = {
  title: string;
  price: string;
  imageUrl?: string;
};
