import type { ConditionGroup } from "@/extensions/dashboard/pages/types";
import type {
  NormalizedProduct,
  ProductPreview,
  SearchOption,
} from "@/store/types";

export interface StoreAdapter {
  searchProducts(
    rules?: ConditionGroup,
    allResults?: boolean,
    hasInventoryQuantityInContent?: boolean
  ): Promise<NormalizedProduct[]>;

  getProductsBySlugs(slugs: string[]): Promise<NormalizedProduct[]>;

  searchProductsByName(name: string): Promise<SearchOption[]>;

  getProduct(slug: string): Promise<SearchOption>;

  getProductPreview(slug: string): Promise<ProductPreview>;

  searchCategories(input: string): Promise<SearchOption[]>;

  getCategory(categoryId: string): Promise<SearchOption>;
}
