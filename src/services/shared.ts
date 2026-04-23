import type { OrderStatus, StatusFlag } from "@/types/admin";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

export const toNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

export const toStatusFlag = (value: unknown, fallback: StatusFlag = 1): StatusFlag => {
  if (value === 0 || value === "0" || value === "inactive") {
    return 0;
  }
  if (value === 1 || value === "1" || value === "active") {
    return 1;
  }
  return fallback;
};

export const toOrderStatus = (value: unknown, fallback: OrderStatus = 0): OrderStatus => {
  const parsed = toNumber(value, fallback);
  if (parsed === 0 || parsed === 1 || parsed === 2) {
    return parsed;
  }
  return fallback;
};

export const toBooleanFlag = (value: unknown, fallback = false) => {
  if (value === true || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === 0 || value === "0") {
    return false;
  }
  return fallback;
};

export const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

