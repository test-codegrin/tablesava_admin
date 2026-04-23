import { requestApi } from "@/api/apiClient";
import type { OrderDetail, OrderLineItem, OrderStatus, OrderSummary } from "@/types/admin";
import { ensureArray, isRecord, toNullableString, toNumber, toOrderStatus } from "./shared";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  0: "Pending",
  1: "Accepted",
  2: "Completed",
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  0: [1],
  1: [2],
  2: [],
};

export const canTransitionOrderStatus = (from: OrderStatus, to: OrderStatus) =>
  ALLOWED_TRANSITIONS[from].includes(to);

const mapOrderLineItem = (value: unknown): OrderLineItem => {
  const payload = isRecord(value) ? value : {};

  const quantity = toNumber(payload.quantity, 1);
  const unitPrice = toNumber(payload.unit_price ?? payload.price);

  return {
    item_id: toNumber(payload.item_id),
    item_name: String(payload.item_name ?? payload.name ?? ""),
    quantity,
    unit_price: unitPrice,
    total_price: toNumber(payload.total_price, quantity * unitPrice),
    options_text: toNullableString(payload.options_text),
  };
};

const mapOrderSummary = (value: unknown): OrderSummary => {
  const payload = isRecord(value) ? value : {};
  return {
    order_id: toNumber(payload.order_id),
    table_id:
      typeof payload.table_id === "number" || typeof payload.table_id === "string"
        ? toNumber(payload.table_id)
        : null,
    table_number:
      typeof payload.table_number === "number" || typeof payload.table_number === "string"
        ? toNumber(payload.table_number)
        : null,
    status: toOrderStatus(payload.status),
    total_amount: toNumber(payload.total_amount ?? payload.total_price),
    created_at: toNullableString(payload.created_at) ?? undefined,
    updated_at: toNullableString(payload.updated_at) ?? undefined,
  };
};

const mapOrderDetail = (value: unknown): OrderDetail => {
  const summary = mapOrderSummary(value);
  const payload = isRecord(value) ? value : {};
  const items = ensureArray<unknown>(payload.items).map(mapOrderLineItem);
  return {
    ...summary,
    items,
  };
};

const extractOrderArray = (value: unknown): OrderSummary[] => {
  if (Array.isArray(value)) {
    return value.map(mapOrderSummary);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.orders)) {
    return value.orders.map(mapOrderSummary);
  }

  if (isRecord(value.data) && Array.isArray(value.data.orders)) {
    return value.data.orders.map(mapOrderSummary);
  }

  return [];
};

export const getOrders = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/orders/items",
  });

  return {
    orders: extractOrderArray(response.data ?? response.raw),
    message: response.message,
  };
};

export const getOrderById = async (orderId: number) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: `/orders/items/${orderId}`,
  });

  return mapOrderDetail(response.data ?? response.raw);
};

export const updateOrderStatus = async (orderId: number, current: OrderStatus, next: OrderStatus) => {
  if (!canTransitionOrderStatus(current, next)) {
    throw new Error(
      `Invalid order transition from ${ORDER_STATUS_LABELS[current]} to ${ORDER_STATUS_LABELS[next]}.`,
    );
  }

  const response = await requestApi<unknown>({
    method: "patch",
    url: `/orders/items/${orderId}/status`,
    data: { status: next },
  });

  return {
    message: response.message || "Order status updated successfully.",
  };
};

