import { requestApi } from "@/api/apiClient";
import type {
  OrderDetail,
  OrderItemQuantity,
  OrderLineItem,
  OrderStatus,
  OrderSummary,
} from "@/types/admin";
import { ensureArray, isRecord, toNullableString, toNumber, toOrderStatus, toString } from "./shared";

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
  const unitPrice = toNumber(payload.unit_price ?? payload.base_price ?? payload.price);
  const options = ensureArray<unknown>(payload.options)
    .map((entry) => (isRecord(entry) ? entry : null))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => ({
      groupName: toString(entry.group_name),
      optionName: toString(entry.option_name),
      price: toNumber(entry.price),
    }))
    .filter((entry) => entry.groupName || entry.optionName);
  const optionsText =
    toNullableString(payload.options_text) ??
    (options.length > 0
      ? options
          .map((entry) =>
            entry.groupName ? `${entry.groupName}: ${entry.optionName}` : entry.optionName,
          )
          .join("\n")
      : null);

  return {
    item_id:
      typeof payload.item_id === "number" || typeof payload.item_id === "string"
        ? toNumber(payload.item_id)
        : null,
    item_name: String(payload.item_name ?? payload.name ?? ""),
    quantity,
    unit_price: unitPrice,
    total_price: toNumber(payload.total_price, quantity * unitPrice),
    options_text: optionsText,
  };
};

const mapItemQuantity = (value: unknown): OrderItemQuantity => {
  const payload = isRecord(value) ? value : {};
  return {
    item_name: toString(payload.item_name),
    quantity: toNumber(payload.quantity, 0),
  };
};

const mapOrderSummary = (value: unknown): OrderSummary => {
  const payload = isRecord(value) ? value : {};
  const itemNames = ensureArray<unknown>(payload.item_names).map((entry) =>
    typeof entry === "string" ? entry : String(entry ?? ""),
  );

  const tableNumber =
    typeof payload.table_number === "string" || typeof payload.table_number === "number"
      ? String(payload.table_number)
      : null;
  const itemQuantities = ensureArray<unknown>(payload.item_quantities).map(mapItemQuantity);
  const totalQuantityFromItems = itemQuantities.reduce((sum, item) => sum + item.quantity, 0);

  return {
    order_id: toNumber(payload.order_id),
    table_id:
      typeof payload.table_id === "number" || typeof payload.table_id === "string"
        ? toNumber(payload.table_id)
        : null,
    table_number: tableNumber,
    item_names: itemNames,
    item_count: toNumber(payload.item_count, itemNames.length),
    total_quantity: toNumber(payload.total_quantity, totalQuantityFromItems),
    item_quantities: itemQuantities,
    status: toOrderStatus(payload.status),
    total_amount: toNumber(payload.amount),
    created_at: toNullableString(payload.created_at) ?? undefined,
    updated_at: toNullableString(payload.updated_at) ?? undefined,
  };
};

const extractOrderEntity = (value: unknown, orderId?: number) => {
  if (Array.isArray(value)) {
    if (typeof orderId === "number") {
      return value.find((entry) => isRecord(entry) && toNumber(entry.order_id) === orderId) ?? value[0];
    }
    return value[0];
  }

  if (!isRecord(value)) {
    return value;
  }

  if (typeof value.order_id !== "undefined") {
    return value;
  }

  if (isRecord(value.order)) {
    return value.order;
  }

  if (Array.isArray(value.orders)) {
    return extractOrderEntity(value.orders, orderId);
  }

  if (isRecord(value.data) && isRecord(value.data.order)) {
    return extractOrderEntity(value.data.order, orderId);
  }

  if (isRecord(value.data) && Array.isArray(value.data.orders)) {
    return extractOrderEntity(value.data.orders, orderId);
  }

  return value;
};

const mapOrderDetail = (value: unknown): OrderDetail => {
  const summary = mapOrderSummary(value);
  const payload = isRecord(value) ? value : {};
  let items = ensureArray<unknown>(payload.items).map(mapOrderLineItem);

  if (items.length === 0 && Array.isArray(payload.item_quantities)) {
    items = payload.item_quantities.map((entry) => {
      const mapped = mapItemQuantity(entry);
      return {
        item_id: null,
        item_name: mapped.item_name,
        quantity: mapped.quantity,
        unit_price: 0,
        total_price: 0,
        options_text: null,
      };
    });
  }

  return {
    ...summary,
    item_count: summary.item_count && summary.item_count > 0 ? summary.item_count : items.length,
    total_quantity:
      summary.total_quantity && summary.total_quantity > 0
        ? summary.total_quantity
        : items.reduce((sum, line) => sum + line.quantity, 0),
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

  const orderEntity = extractOrderEntity(response.data ?? response.raw, orderId);
  return mapOrderDetail(orderEntity);
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

