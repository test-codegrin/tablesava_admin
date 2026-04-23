import { requestApi } from "@/api/apiClient";
import type { Category, StatusFlag, UpsertCategoryPayload } from "@/types/admin";
import { ensureArray, isRecord, toNullableString, toNumber, toStatusFlag, toString } from "./shared";

export const CATEGORY_STATUS_OPTIONS: StatusFlag[] = [0, 1];

export const validateCategoryStatus = (value: unknown): value is StatusFlag =>
  value === 0 || value === 1;

const mapCategory = (value: unknown): Category => {
  const payload = isRecord(value) ? value : {};
  return {
    categories_id: toNumber(payload.categories_id),
    name: toString(payload.name),
    description: toString(payload.description),
    status: toStatusFlag(payload.status),
    created_at: toNullableString(payload.created_at) ?? undefined,
    updated_at: toNullableString(payload.updated_at) ?? undefined,
  };
};

const extractCategoryArray = (value: unknown): Category[] => {
  if (Array.isArray(value)) {
    return value.map(mapCategory);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.categories)) {
    return value.categories.map(mapCategory);
  }

  if (isRecord(value.data) && Array.isArray(value.data.categories)) {
    return value.data.categories.map(mapCategory);
  }

  return [];
};

export const getCategories = async (status?: StatusFlag) => {
  if (typeof status !== "undefined" && !validateCategoryStatus(status)) {
    throw new Error("Category status filter must be 0 or 1.");
  }

  const response = await requestApi<unknown>({
    method: "get",
    url: "/categories",
    params: typeof status === "undefined" ? undefined : { status },
  });

  const categories = extractCategoryArray(response.data ?? response.raw);
  return { categories, message: response.message };
};

export const getCategoryById = async (categoryId: number) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: `/categories/${categoryId}`,
  });

  return mapCategory(response.data ?? response.raw);
};

const buildCategoryPayload = (payload: UpsertCategoryPayload) => {
  if (!validateCategoryStatus(payload.status)) {
    throw new Error("Category status must be 0 or 1.");
  }

  const name = payload.name.trim();
  if (!name) {
    throw new Error("Category name is required.");
  }

  return {
    name,
    description: payload.description?.trim() || "",
    status: payload.status,
  };
};

export const createCategory = async (payload: UpsertCategoryPayload) => {
  const response = await requestApi<unknown>({
    method: "post",
    url: "/categories",
    data: buildCategoryPayload(payload),
  });

  return {
    message: response.message || "Category created successfully.",
  };
};

export const updateCategory = async (categoryId: number, payload: UpsertCategoryPayload) => {
  const response = await requestApi<unknown>({
    method: "put",
    url: `/categories/${categoryId}`,
    data: buildCategoryPayload(payload),
  });

  return {
    message: response.message || "Category updated successfully.",
  };
};

export const deleteCategory = async (categoryId: number) => {
  const response = await requestApi<unknown>({
    method: "delete",
    url: `/categories/${categoryId}`,
  });

  return {
    message: response.message || "Category deleted successfully.",
  };
};

export const filterCategoriesLocally = (
  categories: Category[],
  search: string,
  statusFilter: "all" | StatusFlag,
) => {
  const normalizedSearch = search.trim().toLowerCase();

  return categories.filter((category) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      category.name.toLowerCase().includes(normalizedSearch) ||
      category.description.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === "all" || category.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};

export const paginateCategories = (categories: Category[], page: number, pageSize: number) => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;

  return {
    total: categories.length,
    items: ensureArray<Category>(categories.slice(start, start + safePageSize)),
  };
};

