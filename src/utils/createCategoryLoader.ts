import DataLoader from "dataloader";
import { Category } from "./../entities/Category";

export const createCategoryLoader = () =>
  new DataLoader<number, Category>(async (categoryIds) => {
    const categories = await Category.findByIds(categoryIds as number[]);
    const categoryIdToCategory: Record<number, Category> = {};
    categories.forEach((category) => {
      categoryIdToCategory[category.id] = category;
    });

    return categoryIds.map((categoryId) => categoryIdToCategory[categoryId]);
  });
