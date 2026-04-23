import { requestApi } from "@/api/apiClient";
import type {
  StatusFlag,
  TableQrCodeRecord,
  UpsertTablePayload,
  VendorTable,
} from "@/types/admin";
import {
  ensureArray,
  isRecord,
  toBooleanFlag,
  toNullableString,
  toNumber,
  toStatusFlag,
} from "./shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const mapTable = (value: unknown): VendorTable => {
  const payload = isRecord(value) ? value : {};
  const mappedStatus = toStatusFlag(
    payload.status ?? payload.table_status ?? payload.is_active,
    1,
  );
  const mappedAvailability = toStatusFlag(
    payload.is_available ?? payload.availability ?? Number(toBooleanFlag(payload.available, true)),
    1,
  );

  return {
    table_id: toNumber(payload.table_id),
    table_number: toNumber(payload.table_number),
    capacity: toNumber(payload.capacity, 1),
    status: mappedStatus,
    is_available: mappedAvailability,
    qr_code_url: toNullableString(payload.qr_code_url),
    created_at: toNullableString(payload.created_at) ?? undefined,
    updated_at: toNullableString(payload.updated_at) ?? undefined,
  };
};

const extractTableArray = (value: unknown): VendorTable[] => {
  if (Array.isArray(value)) {
    return value.map(mapTable);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.tables)) {
    return value.tables.map(mapTable);
  }

  if (isRecord(value.data) && Array.isArray(value.data.tables)) {
    return value.data.tables.map(mapTable);
  }

  return [];
};

const normalizeTablePayload = (payload: UpsertTablePayload) => {
  if (!Number.isFinite(payload.table_number) || payload.table_number <= 0) {
    throw new Error("Table number must be a positive number.");
  }

  if (!Number.isFinite(payload.capacity) || payload.capacity <= 0) {
    throw new Error("Capacity must be a positive number.");
  }

  const normalized: Record<string, number> = {
    table_number: Math.floor(payload.table_number),
    capacity: Math.floor(payload.capacity),
  };

  if (typeof payload.status !== "undefined") {
    if (!(payload.status === 0 || payload.status === 1)) {
      throw new Error("Table status must be 0 or 1.");
    }
    normalized.status = payload.status;
  }

  if (typeof payload.is_available !== "undefined") {
    if (!(payload.is_available === 0 || payload.is_available === 1)) {
      throw new Error("Table availability must be 0 or 1.");
    }
    normalized.is_available = payload.is_available;
  }

  return normalized;
};

export const getTables = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/tables",
  });

  return {
    tables: extractTableArray(response.data ?? response.raw),
    message: response.message,
  };
};

export const getTableById = async (tableId: number) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: `/tables/${tableId}`,
  });

  return mapTable(response.data ?? response.raw);
};

export const createTable = async (payload: UpsertTablePayload) => {
  const response = await requestApi<unknown>({
    method: "post",
    url: "/tables",
    data: normalizeTablePayload(payload),
  });

  return {
    message: response.message || "Table created successfully.",
  };
};

export const updateTable = async (tableId: number, payload: UpsertTablePayload) => {
  const response = await requestApi<unknown>({
    method: "put",
    url: `/tables/${tableId}`,
    data: normalizeTablePayload(payload),
  });

  return {
    message: response.message || "Table updated successfully.",
  };
};

export const toggleTableStatus = async (tableId: number) => {
  const response = await requestApi<unknown>({
    method: "patch",
    url: `/tables/${tableId}/toggle-status`,
  });

  return {
    message: response.message || "Table status updated successfully.",
  };
};

export const updateTableAvailability = async (tableId: number, is_available: StatusFlag) => {
  if (!(is_available === 0 || is_available === 1)) {
    throw new Error("Table availability must be 0 or 1.");
  }

  const response = await requestApi<unknown>({
    method: "patch",
    url: `/tables/${tableId}/availability`,
    data: { is_available },
  });

  return {
    message: response.message || "Table availability updated successfully.",
  };
};

export const deleteTable = async (tableId: number) => {
  const response = await requestApi<unknown>({
    method: "delete",
    url: `/tables/${tableId}`,
  });

  return {
    message: response.message || "Table deleted successfully.",
  };
};

const mapQrRecord = (value: unknown): TableQrCodeRecord => {
  const payload = isRecord(value) ? value : {};
  return {
    table_id: toNumber(payload.table_id),
    table_number: toNumber(payload.table_number),
    qr_code_url: toNullableString(payload.qr_code_url),
  };
};

export const getTableQrCodes = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/tables/qr-codes",
  });

  const value = response.data ?? response.raw;
  const records = Array.isArray(value)
    ? value.map(mapQrRecord)
    : isRecord(value) && Array.isArray(value.tables)
      ? value.tables.map(mapQrRecord)
      : isRecord(value) && isRecord(value.data) && Array.isArray(value.data.tables)
        ? value.data.tables.map(mapQrRecord)
        : ensureArray<TableQrCodeRecord>([]);

  return { records, message: response.message };
};

export const getTableQrImageUrl = (tableId: number) =>
  `${API_BASE_URL.replace(/\/$/, "")}/tables/${tableId}/qr`;

