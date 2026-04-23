import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canTransitionOrderStatus,
  getOrderById,
  getOrders,
  ORDER_STATUS_LABELS,
  updateOrderStatus,
} from "@/services/orderService";
import { getTables } from "@/services/tableService";
import type { OrderDetail, OrderStatus, OrderSummary } from "@/types/admin";

const PAGE_SIZE = 10;

const badgeVariantForStatus = (status: OrderStatus): "secondary" | "default" | "outline" => {
  if (status === 0) {
    return "secondary";
  }
  if (status === 1) {
    return "default";
  }
  return "outline";
};

export default function LiveOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders();
      setOrders(response.orders);
    } catch (error) {
      toast.error("Failed to fetch orders", {
        description: parseApiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    try {
      const detail = await getOrderById(orderId);
      setSelectedOrder(detail);
    } catch (error) {
      toast.error("Failed to fetch order detail", {
        description: parseApiError(error).message,
      });
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId !== null) {
      void loadOrderDetail(selectedOrderId);
    }
  }, [selectedOrderId]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        String(order.order_id).includes(normalizedSearch) ||
        String(order.table_number ?? "").includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleTransition = async (nextStatus: OrderStatus) => {
    if (!selectedOrder) {
      return;
    }

    if (!canTransitionOrderStatus(selectedOrder.status, nextStatus)) {
      toast.error("Invalid status transition", {
        description: `Allowed transitions: Pending -> Accepted -> Completed.`,
      });
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await updateOrderStatus(
        selectedOrder.order_id,
        selectedOrder.status,
        nextStatus,
      );
      toast.success("Order status updated", { description: response.message });

      await Promise.all([
        loadOrders(),
        loadOrderDetail(selectedOrder.order_id),
        // Backend updates table availability during order lifecycle.
        getTables(),
      ]);
    } catch (error) {
      toast.error("Status update failed", {
        description: parseApiError(error).message,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const canMoveToAccepted = Boolean(
    selectedOrder && canTransitionOrderStatus(selectedOrder.status, 1),
  );
  const canMoveToCompleted = Boolean(
    selectedOrder && canTransitionOrderStatus(selectedOrder.status, 2),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-zinc-900">Live Orders</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void loadOrders();
          }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <Input
          label="Search"
          placeholder="Order ID or Table #"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="order-status-filter" className="text-sm font-medium">
            Status Filter
          </label>
          <select
            id="order-status-filter"
            className="h-11 border border-black bg-zinc-50 px-3 text-sm"
            value={String(statusFilter)}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "all") {
                setStatusFilter("all");
              } else {
                const parsed = Number(value);
                setStatusFilter(parsed === 1 ? 1 : parsed === 2 ? 2 : 0);
              }
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="0">Pending (0)</option>
            <option value="1">Accepted (1)</option>
            <option value="2">Completed (2)</option>
          </select>
        </div>
      </div>

      <div className="border border-zinc-200 bg-white p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Table #</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell>{order.order_id}</TableCell>
                  <TableCell>{order.table_number ?? "-"}</TableCell>
                  <TableCell>{order.total_amount}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariantForStatus(order.status)}>
                      {ORDER_STATUS_LABELS[order.status]} ({order.status})
                    </Badge>
                  </TableCell>
                  <TableCell>{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedOrderId(order.order_id);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-600">
        <p>
          Showing {paginatedOrders.length} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Order Detail</DialogTitle>
          </DialogHeader>
          {!selectedOrder ? (
            <p className="text-sm text-zinc-500">Loading order detail...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 border border-zinc-200 p-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-zinc-500">Order ID</p>
                  <p className="font-medium">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Table</p>
                  <p className="font-medium">{selectedOrder.table_number ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Status</p>
                  <p className="font-medium">
                    {ORDER_STATUS_LABELS[selectedOrder.status]} ({selectedOrder.status})
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-zinc-500">
                          No line items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedOrder.items.map((line, index) => (
                        <TableRow key={`${line.item_id}-${index}`}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{line.item_name}</span>
                              {line.options_text && (
                                <span className="text-xs text-zinc-500">{line.options_text}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>{line.unit_price}</TableCell>
                          <TableCell>{line.total_price}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedOrderId(null)}
              disabled={updatingStatus}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleTransition(1);
              }}
              disabled={!canMoveToAccepted || updatingStatus}
            >
              {updatingStatus && canMoveToAccepted ? "Updating..." : "Mark Accepted"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleTransition(2);
              }}
              disabled={!canMoveToCompleted || updatingStatus}
            >
              {updatingStatus && canMoveToCompleted ? "Updating..." : "Mark Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

