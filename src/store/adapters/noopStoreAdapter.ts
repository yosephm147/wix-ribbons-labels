import { NO_IMAGE_PRODUCT_IMAGE } from "../productImagePlaceholders";
import type { StoreAdapter } from "./storeAdapter";

export const noopStoreAdapter: StoreAdapter = {
  async searchProducts() {
    return [];
  },
  async getProductsBySlugs() {
    return [];
  },
  async searchProductsByName() {
    return [];
  },
  async getProduct(slug) {
    return {
      id: "",
      label: "",
      slug,
      imageUrl: NO_IMAGE_PRODUCT_IMAGE,
    };
  },
  async getProductPreview() {
    return { title: "", price: "", imageUrl: undefined };
  },
  async searchCategories() {
    return [];
  },
  async getCategory(categoryId) {
    return { id: categoryId, label: "", slug: "" };
  },
};
