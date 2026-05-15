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
  toString,
} from "./shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const mapTable = (value: unknown): VendorTable => {
  const payload = isRecord(value) ? value : {};
  const rawStatus =
    payload.status ??
    payload.table_status ??
    payload.is_active ??
    payload.enabled ??
    payload.is_enabled;
  const rawAvailability =
    payload.availability_status ??
    payload.is_available ??
    payload.availability ??
    payload.available ??
    Number(toBooleanFlag(payload.is_available_now, false));
  const mappedStatus =
    rawStatus === undefined || rawStatus === null
      ? undefined
      : toStatusFlag(rawStatus, 1);
  const mappedAvailability =
    rawAvailability === undefined || rawAvailability === null
      ? undefined
      : toStatusFlag(rawAvailability, 1);

  return {
    table_id: toNumber(payload.table_id),
    table_number: toString(payload.table_number),
    capacity: toNumber(payload.seating_capacity ?? payload.capacity, 1),
    area_type: toString(payload.area_type, "indoor"),
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

  if (Array.isArray(value.data)) {
    return value.data.map(mapTable);
  }

  if (isRecord(value.data) && Array.isArray(value.data.tables)) {
    return value.data.tables.map(mapTable);
  }

  if (isRecord(value.data) && Array.isArray(value.data.data)) {
    return value.data.data.map(mapTable);
  }

  return [];
};

const extractTableDetail = (value: unknown): VendorTable => {
  if (!isRecord(value)) {
    return mapTable(value);
  }

  if (isRecord(value.table)) {
    return mapTable(value.table);
  }

  if (Array.isArray(value.data) && value.data.length > 0) {
    return mapTable(value.data[0]);
  }

  if (Array.isArray(value.tables) && value.tables.length > 0) {
    return mapTable(value.tables[0]);
  }

  if (isRecord(value.data) && isRecord(value.data.table)) {
    return mapTable(value.data.table);
  }

  if (
    isRecord(value.data) &&
    Array.isArray(value.data.tables) &&
    value.data.tables.length > 0
  ) {
    return mapTable(value.data.tables[0]);
  }

  if (
    isRecord(value.data) &&
    Array.isArray(value.data.data) &&
    value.data.data.length > 0
  ) {
    return mapTable(value.data.data[0]);
  }

  if (isRecord(value.data)) {
    return mapTable(value.data);
  }

  return mapTable(value);
};

const normalizeTablePayload = (payload: UpsertTablePayload) => {
  const tableNumber = payload.table_number.trim();
  if (!tableNumber) {
    throw new Error("Table number is required.");
  }

  if (!Number.isFinite(payload.capacity) || payload.capacity <= 0) {
    throw new Error("Seating capacity must be a positive number.");
  }

  const normalized: Record<string, number | string> = {
    table_number: tableNumber,
    seating_capacity: Math.floor(payload.capacity),
    area_type: payload.area_type?.trim() || "indoor",
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
    normalized.availability_status = payload.is_available;
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

  return extractTableDetail(response.data ?? response.raw);
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

export const updateTable = async (
  tableId: number,
  payload: UpsertTablePayload,
) => {
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

export const updateTableAvailability = async (
  tableId: number,
  is_available: StatusFlag,
) => {
  if (!(is_available === 0 || is_available === 1)) {
    throw new Error("Table availability must be 0 or 1.");
  }

  const response = await requestApi<unknown>({
    method: "patch",
    url: `/tables/${tableId}/availability`,
    data: { availability_status: is_available },
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
    table_number: toString(payload.table_number),
    area_type: toNullableString(payload.area_type) ?? undefined,
    qr_code_url: toNullableString(payload.qr_code_url),
    qr_code_base64: toNullableString(payload.qr_code_base64),
    qr_code_data_url: toNullableString(payload.qr_code_data_url),
    qr_content: toNullableString(payload.qr_content),
    qr_generated_at: toNullableString(payload.qr_generated_at),
    table_name: toString(payload.table_name ?? payload.table_number),
  };
};

export const getTableQrCodes = async (options?: { includeQr?: boolean }) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/tables/qr-codes",
    params: options?.includeQr ? { include_qr: "true" } : undefined,
  });

  const value = response.data ?? response.raw;
  const records = Array.isArray(value)
    ? value.map(mapQrRecord)
    : isRecord(value) && Array.isArray(value.tables)
      ? value.tables.map(mapQrRecord)
      : isRecord(value) &&
          isRecord(value.data) &&
          Array.isArray(value.data.tables)
        ? value.data.tables.map(mapQrRecord)
        : ensureArray<TableQrCodeRecord>([]);

  return { records, message: response.message };
};

export const generateTableQr = async (tableId: number) => {
  const response = await requestApi<unknown>({
    method: "post",
    url: `/tables/${tableId}/qr`,
  });

  return {
    qr: mapQrRecord(response.data ?? response.raw),
    message: response.message || "Table QR code generated successfully.",
  };
};

export const getTableQrImageUrl = (tableId: number) =>
  `${API_BASE_URL.replace(/\/$/, "")}/tables/${tableId}/qr`;
