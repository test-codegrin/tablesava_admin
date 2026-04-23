import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseApiError } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/pages/Loader";
import { ORDER_STATUS_LABELS } from "@/services/orderService";
import { getDashboardOverview, getPaymentMethodShareTotal } from "@/services/dashboardService";
import type { DashboardOverview } from "@/types/admin";

const AUTO_REFRESH_MS = 25_000;
const DASHBOARD_OVERVIEW_QUERY = {
  latest_limit: 3,
  weekly_days: 7,
  payment_days: 30,
  top_limit: 3,
  top_days: 30,
} as const;
const REFRESH_EVENTS = [
  "dashboard:refresh",
  "orders:status-updated",
  "order-status-updated",
  "payments:completed",
  "payment:completed",
] as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (value: string | undefined) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOverview = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = Boolean(options?.showLoader);

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await getDashboardOverview(DASHBOARD_OVERVIEW_QUERY);
      setOverview(response.overview);
      setErrorStatus(null);
      setErrorMessage(null);
    } catch (error) {
      const parsed = parseApiError(error);

      if (parsed.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setErrorStatus(parsed.status);
      setErrorMessage(parsed.message);
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    void fetchOverview({ showLoader: true });
  }, [fetchOverview]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchOverview();
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchOverview]);

  useEffect(() => {
    const onRefreshEvent = () => {
      void fetchOverview();
    };

    for (const eventName of REFRESH_EVENTS) {
      window.addEventListener(eventName, onRefreshEvent);
    }

    return () => {
      for (const eventName of REFRESH_EVENTS) {
        window.removeEventListener(eventName, onRefreshEvent);
      }
    };
  }, [fetchOverview]);

  const weeklyChart = overview?.weekly_revenue.chart ?? [];
  const weeklyMax = useMemo(
    () => Math.max(1, ...weeklyChart.map((entry) => entry.revenue)),
    [weeklyChart],
  );
  const paymentMethods = overview?.payment_methods.methods ?? [];
  const paymentShareTotal = useMemo(
    () => getPaymentMethodShareTotal(paymentMethods),
    [paymentMethods],
  );
  const latestOrders = overview?.latest_orders ?? [];
  const topSellingDishes = overview?.top_selling_dishes ?? [];

  if (loading) {
    return (
      <div className="border border-zinc-200 bg-white p-4">
        <Loader message="Loading dashboard..." className="min-h-[240px]" />
      </div>
    );
  }

  if (!overview && errorStatus === 500) {
    return (
      <div className="space-y-4">
        <div className="border border-red-200 bg-red-50 p-4">
          <h1 className="text-base font-semibold text-red-700">Server issue while loading dashboard</h1>
          <p className="mt-1 text-sm text-red-700">
            {errorMessage || "Please try again in a moment."}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void fetchOverview({ showLoader: true });
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-zinc-900">Dashboard Overview</h1>
        <Button
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={() => {
            void fetchOverview();
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {errorMessage && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Today Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatCurrency(overview?.todays_revenue ?? 0)}
          </p>
        </div>
        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Live Current Orders</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {overview?.live_current_orders ?? 0}
          </p>
        </div>
        <div className="border border-zinc-200 bg-white p-4 md:col-span-2 xl:col-span-2">
          <p className="text-xs text-zinc-500">Latest 3 Orders</p>
          {latestOrders.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No data</p>
          ) : (
            <div className="mt-2 space-y-2">
              {latestOrders.map((order) => (
                <div
                  key={`${order.order_id}-${order.created_at ?? "na"}`}
                  className="flex flex-wrap items-center justify-between gap-2 border border-zinc-200 p-2"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Order #{order.order_id}</p>
                    <p className="text-xs text-zinc-500">
                      Table {order.table_number ?? "-"} - {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === 2 ? "default" : "secondary"} className={order.status === 2 ? "bg-green-600 text-white" : undefined}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <p className="text-sm font-semibold text-zinc-900">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="border border-zinc-200 bg-white p-4 xl:col-span-2">
          <p className="text-sm font-semibold text-zinc-900">Weekly Revenue</p>
          <p className="text-xs text-zinc-500">Last 7 days</p>
          {weeklyChart.length === 0 ? (
            <div className="mt-4 flex min-h-[180px] items-center justify-center text-sm text-zinc-500">
              No data
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex min-h-[180px] items-end gap-2 border-b border-zinc-200 pb-2">
                {weeklyChart.map((point) => (
                  <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/80"
                      style={{ height: `${Math.max(8, Math.round((point.revenue / weeklyMax) * 160))}px` }}
                      title={`${point.label}: ${formatCurrency(point.revenue)}`}
                    />
                    <span className="text-[10px] text-zinc-500">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">Payment Methods</p>
          {paymentMethods.length === 0 ? (
            <div className="mt-4 flex min-h-[180px] items-center justify-center text-sm text-zinc-500">
              No data
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700">{method.method}</span>
                    <span className="font-medium text-zinc-900">
                      {method.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100">
                    <div
                      className="h-2 bg-primary"
                      style={{
                        width: `${Math.min(100, Math.max(0, method.percentage))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{formatCurrency(method.amount)}</p>
                </div>
              ))}
              <p className="text-xs text-zinc-500">
                Total Share: {paymentShareTotal.toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Top Selling Dishes</p>
        {topSellingDishes.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No data</p>
        ) : (
          <div className="mt-3 divide-y divide-zinc-100">
            {topSellingDishes.map((dish, index) => (
              <div key={`${dish.dish_name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {index + 1}. {dish.dish_name}
                  </p>
                  <p className="text-xs text-zinc-500">{dish.quantity_sold} sold</p>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{formatCurrency(dish.total_sales)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
