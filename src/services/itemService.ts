import { requestApi } from "@/api/apiClient";
import type {
  CreateItemPayload,
  Item,
  ItemOption,
  ItemOptionGroup,
  StatusFlag,
  UpdateItemPayload,
} from "@/types/admin";
import {
  ensureArray,
  isRecord,
  toNullableString,
  toNumber,
  toStatusFlag,
  toString,
} from "./shared";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export type OptionGroupUpdateMode = "replace" | "patch";

type ItemListLike = {
  items?: unknown[];
} & Record<string, unknown>;

const mapItemOption = (value: unknown): ItemOption => {
  const payload = isRecord(value) ? value : {};
  return {
    option_id:
      typeof payload.option_id === "number" || typeof payload.option_id === "string"
        ? toNumber(payload.option_id)
        : undefined,
    name: toString(payload.name),
    price_delta: toNumber(payload.price_delta ?? payload.additional_price),
    is_deleted: payload.is_deleted === true || payload.is_deleted === 1,
  };
};

const mapItemOptionGroup = (value: unknown): ItemOptionGroup => {
  const payload = isRecord(value) ? value : {};
  const rawOptions = ensureArray<unknown>(payload.options);
  return {
    group_id:
      typeof payload.group_id === "number" || typeof payload.group_id === "string"
        ? toNumber(payload.group_id)
        : undefined,
    name: toString(payload.name),
    required: payload.required === true || payload.required === 1 || payload.required === "1",
    min_select: toNumber(payload.min_select),
    max_select: toNumber(payload.max_select),
    options: rawOptions.map(mapItemOption),
    is_deleted: payload.is_deleted === true || payload.is_deleted === 1,
  };
};

const mapItem = (value: unknown): Item => {
  const payload = isRecord(value) ? value : {};
  const optionGroups = ensureArray<unknown>(payload.option_groups).map(mapItemOptionGroup);

  return {
    item_id: toNumber(payload.item_id),
    categories_id: toNumber(payload.categories_id),
    name: toString(payload.name),
    description: toString(payload.description),
    price: toNumber(payload.price),
    status: toStatusFlag(payload.status),
    photo_url: toNullableString(payload.photo_url),
    option_groups: optionGroups.length > 0 ? optionGroups : undefined,
    created_at: toNullableString(payload.created_at) ?? undefined,
    updated_at: toNullableString(payload.updated_at) ?? undefined,
  };
};

const extractItemArray = (value: unknown): Item[] => {
  if (Array.isArray(value)) {
    return value.map(mapItem);
  }

  if (!isRecord(value)) {
    return [];
  }

  const objectValue = value as ItemListLike;

  if (Array.isArray(objectValue.items)) {
    return objectValue.items.map(mapItem);
  }

  if (isRecord(value.data) && Array.isArray(value.data.items)) {
    return value.data.items.map(mapItem);
  }

  return [];
};

const coerceItemResponse = (value: unknown) => {
  if (!isRecord(value)) {
    return mapItem(value);
  }

  if (isRecord(value.item)) {
    return mapItem(value.item);
  }

  return mapItem(value);
};

const validateImageFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Photo must be an image file.");
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Photo must be 5MB or smaller.");
  }
};

const validateOptionGroups = (groups: ItemOptionGroup[]) => {
  groups.forEach((group, groupIndex) => {
    if (!group.name.trim()) {
      throw new Error(`Option group ${groupIndex + 1}: name is required.`);
    }
    if (group.min_select < 0 || group.max_select < 0) {
      throw new Error(`Option group ${groupIndex + 1}: min/max must be non-negative.`);
    }
    if (group.max_select < group.min_select) {
      throw new Error(`Option group ${groupIndex + 1}: max_select must be >= min_select.`);
    }
    if (!Array.isArray(group.options) || group.options.length === 0) {
      throw new Error(`Option group ${groupIndex + 1}: at least one option is required.`);
    }

    group.options.forEach((option, optionIndex) => {
      if (!option.name.trim()) {
        throw new Error(
          `Option group ${groupIndex + 1}, option ${optionIndex + 1}: name is required.`,
        );
      }
    });
  });
};

export const buildOptionGroupReplacePayload = (groups: ItemOptionGroup[]) => {
  validateOptionGroups(groups);

  return groups.map((group) => ({
    name: group.name.trim(),
    required: Boolean(group.required),
    min_select: toNumber(group.min_select),
    max_select: toNumber(group.max_select),
    options: group.options.map((option) => ({
      name: option.name.trim(),
      price_delta: toNumber(option.price_delta),
    })),
  }));
};

export const buildOptionGroupPatchPayload = (groups: ItemOptionGroup[]) => {
  validateOptionGroups(groups.filter((group) => group.is_deleted !== true));

  return groups.map((group) => ({
    ...(typeof group.group_id === "number" ? { group_id: group.group_id } : {}),
    name: group.name.trim(),
    required: Boolean(group.required),
    min_select: toNumber(group.min_select),
    max_select: toNumber(group.max_select),
    ...(group.is_deleted ? { is_deleted: true } : {}),
    options: group.options.map((option) => ({
      ...(typeof option.option_id === "number" ? { option_id: option.option_id } : {}),
      name: option.name.trim(),
      price_delta: toNumber(option.price_delta),
      ...(option.is_deleted ? { is_deleted: true } : {}),
    })),
  }));
};

type BuildItemMultipartPayloadArgs = {
  payload: CreateItemPayload | UpdateItemPayload;
  optionMode: OptionGroupUpdateMode;
};

export const buildItemMultipartPayload = ({ payload, optionMode }: BuildItemMultipartPayloadArgs) => {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Item name is required.");
  }

  if (!(payload.status === 0 || payload.status === 1)) {
    throw new Error("Item status must be 0 or 1.");
  }

  if (payload.price < 0) {
    throw new Error("Item price cannot be negative.");
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", payload.description?.trim() || "");
  formData.append("price", String(payload.price));
  formData.append("status", String(payload.status));

  if (payload.photo instanceof File) {
    validateImageFile(payload.photo);
    // Backend expects the file key exactly as `photo`.
    formData.append("photo", payload.photo);
  }

  if (Array.isArray(payload.option_groups) && payload.option_groups.length > 0) {
    const normalizedGroups =
      optionMode === "patch"
        ? buildOptionGroupPatchPayload(payload.option_groups)
        : buildOptionGroupReplacePayload(payload.option_groups);
    formData.append("option_groups", JSON.stringify(normalizedGroups));
  }

  return formData;
};

export const getItems = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/items",
  });

  return { items: extractItemArray(response.data ?? response.raw), message: response.message };
};

export const getItemById = async (itemId: number) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: `/items/${itemId}`,
  });

  return coerceItemResponse(response.data ?? response.raw);
};

export const getCategoryItems = async (categoryId: number) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: `/categories/${categoryId}/items`,
  });

  return { items: extractItemArray(response.data ?? response.raw), message: response.message };
};

const createItemPayload = (payload: CreateItemPayload, optionMode: OptionGroupUpdateMode) =>
  buildItemMultipartPayload({ payload, optionMode });

export const createItem = async (
  categoryId: number,
  payload: CreateItemPayload,
  optionMode: OptionGroupUpdateMode = "replace",
) => {
  const response = await requestApi<unknown>({
    method: "post",
    url: `/categories/${categoryId}/items`,
    data: createItemPayload(payload, optionMode),
  });

  return {
    message: response.message || "Item created successfully.",
  };
};

export const updateItemByCategory = async (
  categoryId: number,
  itemId: number,
  payload: UpdateItemPayload,
  optionMode: OptionGroupUpdateMode = "replace",
) => {
  const response = await requestApi<unknown>({
    method: "put",
    url: `/categories/${categoryId}/items/${itemId}`,
    data: buildItemMultipartPayload({ payload, optionMode }),
  });

  return {
    message: response.message || "Item updated successfully.",
  };
};

export const updateItem = async (
  itemId: number,
  payload: UpdateItemPayload,
  optionMode: OptionGroupUpdateMode = "patch",
) => {
  const response = await requestApi<unknown>({
    method: "put",
    url: `/items/${itemId}`,
    data: buildItemMultipartPayload({ payload, optionMode }),
  });

  return {
    message: response.message || "Item updated successfully.",
  };
};

export const patchItemStatus = async (itemId: number, status: StatusFlag) => {
  if (!(status === 0 || status === 1)) {
    throw new Error("Item status must be 0 or 1.");
  }

  const response = await requestApi<unknown>({
    method: "patch",
    url: `/items/${itemId}/status`,
    data: { status },
  });

  return {
    message: response.message || "Item status updated successfully.",
  };
};

export const deleteItem = async (itemId: number) => {
  const response = await requestApi<unknown>({
    method: "delete",
    url: `/items/${itemId}`,
  });

  return {
    message: response.message || "Item deleted successfully.",
  };
};

export const filterItemsLocally = (items: Item[], search: string, statusFilter: "all" | StatusFlag) => {
  const normalizedSearch = search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
};

