import { requestApi } from "@/api/apiClient";
import type {
  DashboardLatestOrder,
  DashboardOverview,
  DashboardOverviewQuery,
  DashboardPaymentMethod,
  DashboardTopDish,
  DashboardWeeklyRevenuePoint,
} from "@/types/admin";
import { ensureArray, isRecord, toNumber, toNullableString, toOrderStatus } from "./shared";

const hasOverviewKeys = (value: Record<string, unknown>) =>
  "todays_revenue" in value ||
  "live_current_orders" in value ||
  "latest_orders" in value ||
  "weekly_revenue" in value ||
  "payment_methods" in value ||
  "top_selling_dishes" in value;

const extractOverviewRoot = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {};
  }

  if (hasOverviewKeys(value)) {
    return value;
  }

  if (isRecord(value.overview)) {
    return value.overview;
  }

  if (isRecord(value.data)) {
    if (hasOverviewKeys(value.data)) {
      return value.data;
    }
    if (isRecord(value.data.overview)) {
      return value.data.overview;
    }
  }

  return value;
};

const pickNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (isRecord(value)) {
    if (typeof value.amount !== "undefined") return toNumber(value.amount, fallback);
    if (typeof value.total !== "undefined") return toNumber(value.total, fallback);
    if (typeof value.value !== "undefined") return toNumber(value.value, fallback);
    if (typeof value.count !== "undefined") return toNumber(value.count, fallback);
    if (typeof value.revenue !== "undefined") return toNumber(value.revenue, fallback);
  }

  return toNumber(value, fallback);
};

const mapLatestOrder = (value: unknown): DashboardLatestOrder => {
  const payload = isRecord(value) ? value : {};
  const tableNumber =
    typeof payload.table_number === "string" || typeof payload.table_number === "number"
      ? String(payload.table_number)
      : toNullableString(payload.table_no) ?? toNullableString(payload.table);

  return {
    order_id: toNumber(payload.order_id ?? payload.id),
    table_number: tableNumber,
    total_amount: toNumber(payload.total_amount ?? payload.total ?? payload.amount),
    status: toOrderStatus(payload.status),
    created_at:
      toNullableString(payload.created_at) ??
      toNullableString(payload.createdAt) ??
      undefined,
  };
};

const extractLatestOrders = (value: unknown): DashboardLatestOrder[] => {
  if (Array.isArray(value)) {
    return value.map(mapLatestOrder);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.orders)) {
    return value.orders.map(mapLatestOrder);
  }

  if (Array.isArray(value.data)) {
    return value.data.map(mapLatestOrder);
  }

  if (isRecord(value.data) && Array.isArray(value.data.orders)) {
    return value.data.orders.map(mapLatestOrder);
  }

  return [];
};

const mapWeeklyPoint = (value: unknown, index: number): DashboardWeeklyRevenuePoint => {
  const payload = isRecord(value) ? value : {};
  const key =
    toNullableString(payload.key) ??
    toNullableString(payload.day) ??
    toNullableString(payload.date) ??
    toNullableString(payload.label) ??
    `P${index + 1}`;
  const label =
    toNullableString(payload.label) ??
    toNullableString(payload.day_label) ??
    toNullableString(payload.day) ??
    key;

  return {
    key,
    label,
    revenue: toNumber(payload.revenue ?? payload.amount ?? payload.total ?? payload.value),
  };
};

const extractWeeklyChart = (value: unknown): DashboardWeeklyRevenuePoint[] => {
  if (Array.isArray(value)) {
    return value.map(mapWeeklyPoint);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.chart)) {
    return value.chart.map(mapWeeklyPoint);
  }

  if (Array.isArray(value.data)) {
    return value.data.map(mapWeeklyPoint);
  }

  if (isRecord(value.data) && Array.isArray(value.data.chart)) {
    return value.data.chart.map(mapWeeklyPoint);
  }

  return [];
};

const mapPaymentMethod = (value: unknown): DashboardPaymentMethod => {
  const payload = isRecord(value) ? value : {};
  const rawPercentage = toNumber(payload.percentage ?? payload.percent ?? payload.share, 0);
  const normalizedPercentage = rawPercentage > 0 && rawPercentage <= 1 ? rawPercentage * 100 : rawPercentage;

  return {
    method:
      toNullableString(payload.method) ??
      toNullableString(payload.name) ??
      toNullableString(payload.type) ??
      "Unknown",
    amount: toNumber(payload.amount ?? payload.total ?? payload.value ?? payload.revenue),
    percentage: normalizedPercentage,
  };
};

const extractPaymentMethods = (value: unknown): DashboardPaymentMethod[] => {
  if (Array.isArray(value)) {
    return value.map(mapPaymentMethod);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.methods)) {
    return value.methods.map(mapPaymentMethod);
  }

  if (Array.isArray(value.data)) {
    return value.data.map(mapPaymentMethod);
  }

  if (isRecord(value.data) && Array.isArray(value.data.methods)) {
    return value.data.methods.map(mapPaymentMethod);
  }

  return [];
};

const mapTopDish = (value: unknown): DashboardTopDish => {
  const payload = isRecord(value) ? value : {};
  const id = toNumber(payload.dish_id ?? payload.item_id ?? payload.id, NaN);

  return {
    dish_id: Number.isFinite(id) ? id : null,
    dish_name:
      toNullableString(payload.dish_name) ??
      toNullableString(payload.item_name) ??
      toNullableString(payload.name) ??
      "Untitled Dish",
    quantity_sold: toNumber(
      payload.quantity_sold ?? payload.total_quantity ?? payload.qty_sold ?? payload.count,
    ),
    total_sales: toNumber(payload.total_sales ?? payload.revenue ?? payload.amount ?? payload.total),
  };
};

const extractTopDishes = (value: unknown): DashboardTopDish[] => {
  if (Array.isArray(value)) {
    return value.map(mapTopDish);
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.items)) {
    return value.items.map(mapTopDish);
  }

  if (Array.isArray(value.data)) {
    return value.data.map(mapTopDish);
  }

  return [];
};

const toPositiveInt = (value: unknown) => {
  const parsed = Math.floor(toNumber(value, 0));
  return parsed > 0 ? parsed : undefined;
};

const buildOverviewParams = (query?: DashboardOverviewQuery) => {
  const params: Record<string, number> = {};

  const latestLimit = toPositiveInt(query?.latest_limit);
  if (latestLimit) {
    params.latest_limit = latestLimit;
  }

  const weeklyDays = toPositiveInt(query?.weekly_days);
  if (weeklyDays) {
    params.weekly_days = weeklyDays;
  }

  const paymentDays = toPositiveInt(query?.payment_days);
  if (paymentDays) {
    params.payment_days = paymentDays;
  }

  const topLimit = toPositiveInt(query?.top_limit);
  if (topLimit) {
    params.top_limit = topLimit;
  }

  const topDays = toPositiveInt(query?.top_days);
  if (topDays) {
    params.top_days = topDays;
  }

  return params;
};

export const mapDashboardOverview = (value: unknown): DashboardOverview => {
  const root = extractOverviewRoot(value);
  const latestOrders = extractLatestOrders(root.latest_orders);
  const weeklyChart = extractWeeklyChart(root.weekly_revenue);
  const paymentMethods = extractPaymentMethods(root.payment_methods);
  const topSellingDishes = extractTopDishes(root.top_selling_dishes);

  return {
    todays_revenue: pickNumber(root.todays_revenue),
    live_current_orders: pickNumber(root.live_current_orders),
    latest_orders: latestOrders,
    weekly_revenue: {
      chart: weeklyChart,
    },
    payment_methods: {
      methods: paymentMethods,
    },
    top_selling_dishes: topSellingDishes,
  };
};

export const getDashboardOverview = async (query?: DashboardOverviewQuery) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/overview",
    params: buildOverviewParams(query),
  });

  return {
    overview: mapDashboardOverview(response.data ?? response.raw),
    message: response.message,
  };
};

export const getDashboardTodaysRevenue = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/todays-revenue",
  });
  const root = extractOverviewRoot(response.data ?? response.raw);
  return {
    todays_revenue: pickNumber(root.todays_revenue ?? root.data ?? root),
    message: response.message,
  };
};

export const getDashboardLiveCurrentOrders = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/live-current-orders",
  });
  const root = extractOverviewRoot(response.data ?? response.raw);
  return {
    live_current_orders: pickNumber(root.live_current_orders ?? root.data ?? root),
    message: response.message,
  };
};

export const getDashboardLatestOrders = async (limit = 3) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/latest-orders",
    params: { limit: toPositiveInt(limit) ?? 3 },
  });
  return {
    latest_orders: extractLatestOrders(response.data ?? response.raw),
    message: response.message,
  };
};

export const getDashboardWeeklyRevenue = async (days = 7) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/weekly-revenue",
    params: { days: toPositiveInt(days) ?? 7 },
  });
  return {
    weekly_revenue: {
      chart: extractWeeklyChart(response.data ?? response.raw),
    },
    message: response.message,
  };
};

export const getDashboardPaymentMethods = async (days = 30) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/payment-methods",
    params: { days: toPositiveInt(days) ?? 30 },
  });
  return {
    payment_methods: {
      methods: extractPaymentMethods(response.data ?? response.raw),
    },
    message: response.message,
  };
};

export const getDashboardTopSellingDishes = async (limit = 3, days = 30) => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/dashboard/top-selling-dishes",
    params: {
      limit: toPositiveInt(limit) ?? 3,
      days: toPositiveInt(days) ?? 30,
    },
  });
  return {
    top_selling_dishes: extractTopDishes(response.data ?? response.raw),
    message: response.message,
  };
};

export const getPaymentMethodShareTotal = (methods: DashboardPaymentMethod[]) =>
  ensureArray<DashboardPaymentMethod>(methods).reduce((sum, entry) => sum + entry.percentage, 0);
