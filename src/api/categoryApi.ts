import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "@/services/categoryService";
import type { StatusFlag } from "@/types/admin";

export const getCategoriesApi = async (status?: StatusFlag) => getCategories(status);

export const getCategoryByIdApi = async (id: number) => getCategoryById(id);

export const createCategoryApi = async (data: {
  name: string;
  description: string;
  status: StatusFlag;
}) => createCategory(data);

export const updateCategoryApi = async (
  id: number,
  data: { name: string; description: string; status: StatusFlag },
) => updateCategory(id, data);

export const deleteCategoryApi = async (id: number) => deleteCategory(id);

