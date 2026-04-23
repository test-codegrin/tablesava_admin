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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createTable,
  deleteTable,
  getTableById,
  getTableQrImageUrl,
  getTables,
  toggleTableStatus,
  updateTable,
  updateTableAvailability,
} from "@/services/tableService";
import type { StatusFlag, UpsertTablePayload, VendorTable } from "@/types/admin";
import Loader from "@/pages/Loader";

const PAGE_SIZE = 10;

type TableForm = {
  table_number: string;
  capacity: string;
  area_type: string;
  status: StatusFlag;
  is_available: StatusFlag;
};

const createInitialForm = (): TableForm => ({
  table_number: "",
  capacity: "",
  area_type: "indoor",
  status: 1,
  is_available: 1,
});

const statusLabel = (status: StatusFlag | undefined) =>
  status === 0 ? "Disabled" : status === 1 ? "Enabled" : "-";
const availabilityLabel = (flag: StatusFlag | undefined) =>
  flag === 0 ? "Occupied" : flag === 1 ? "Available" : "-";
const mergeTableWithFallback = (current: VendorTable, incoming: VendorTable): VendorTable => ({
  ...current,
  ...incoming,
  status: typeof incoming.status === "undefined" ? current.status ?? 1 : incoming.status,
  is_available:
    typeof incoming.is_available === "undefined"
      ? current.is_available ?? 1
      : incoming.is_available,
});

export default function TableManagement() {
  const [tables, setTables] = useState<VendorTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorTable | null>(null);
  const [previewTable, setPreviewTable] = useState<VendorTable | null>(null);
  const [form, setForm] = useState<TableForm>(createInitialForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | StatusFlag>("all");
  const [page, setPage] = useState(1);
  const [qrPreviewTable, setQrPreviewTable] = useState<VendorTable | null>(null);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await getTables();
      setTables((previous) =>
        response.tables.map((table) => {
          const previousMatch = previous.find((entry) => entry.table_id === table.table_id);
          return {
            ...table,
            status:
              typeof table.status === "undefined" ? previousMatch?.status ?? 1 : table.status,
            is_available:
              typeof table.is_available === "undefined"
                ? previousMatch?.is_available ?? 1
                : table.is_available,
          };
        }),
      );
    } catch (error) {
      toast.error("Failed to fetch tables", {
        description: parseApiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTables();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return tables.filter((table) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        String(table.table_number).includes(normalizedSearch) ||
        String(table.capacity).includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || table.status === statusFilter;
      const matchesAvailability =
        availabilityFilter === "all" || table.is_available === availabilityFilter;

      return matchesSearch && matchesStatus && matchesAvailability;
    });
  }, [availabilityFilter, search, statusFilter, tables]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedTables = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openCreateDialog = () => {
    setEditing(null);
    setForm(createInitialForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (table: VendorTable) => {
    setFormError(null);
    setDialogOpen(true);
    setSaving(true);

    try {
      const detail = await getTableById(table.table_id);
      setEditing(detail);
      setForm({
        table_number: String(detail.table_number),
        capacity: String(detail.capacity),
        area_type: detail.area_type || "indoor",
        status: detail.status ?? 1,
        is_available: detail.is_available ?? 1,
      });
    } catch (error) {
      setDialogOpen(false);
      toast.error("Failed to load table detail", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    const capacity = Number(form.capacity);

    if (!form.table_number.trim()) {
      throw new Error("Table number is required.");
    }
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error("Seating capacity must be a positive number.");
    }
    if (!(form.status === 0 || form.status === 1)) {
      throw new Error("Status must be 0 or 1.");
    }
    if (!(form.is_available === 0 || form.is_available === 1)) {
      throw new Error("Availability must be 0 or 1.");
    }
  };

  const buildPayload = (): UpsertTablePayload => ({
    table_number: form.table_number.trim(),
    capacity: Number(form.capacity),
    area_type: form.area_type,
    status: form.status,
    is_available: form.is_available,
  });

  const onSave = async () => {
    try {
      validateForm();
      setFormError(null);
    } catch (error) {
      const message = parseApiError(error).message;
      setFormError(message);
      toast.error("Validation failed", { description: message });
      return;
    }

    setSaving(true);
    try {
      const response = editing
        ? await updateTable(editing.table_id, buildPayload())
        : await createTable(buildPayload());

      toast.success(editing ? "Table updated" : "Table created", {
        description: response.message,
      });
      setDialogOpen(false);
      await loadTables();
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        toast.error("Duplicate table number", {
          description: parsed.message,
        });
      } else {
        toast.error("Table save failed", { description: parsed.message });
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (tableId: number) => {
    if (!window.confirm("Delete this table?")) {
      return;
    }

    try {
      const response = await deleteTable(tableId);
      toast.success("Table deleted", { description: response.message });
      await loadTables();
    } catch (error) {
      toast.error("Delete failed", { description: parseApiError(error).message });
    }
  };

  const refreshTableRow = async (tableId: number) => {
    try {
      const detail = await getTableById(tableId);
      setTables((prev) =>
        prev.map((table) =>
          table.table_id === tableId ? mergeTableWithFallback(table, detail) : table,
        ),
      );
      setPreviewTable((prev) =>
        prev?.table_id === tableId ? mergeTableWithFallback(prev, detail) : prev,
      );
      setQrPreviewTable((prev) =>
        prev?.table_id === tableId ? mergeTableWithFallback(prev, detail) : prev,
      );
    } catch {
      // Ignore row detail refresh failure and keep optimistic data.
    }
  };

  const patchTableRow = (tableId: number, updates: Partial<VendorTable>) => {
    setTables((prev) =>
      prev.map((table) => (table.table_id === tableId ? { ...table, ...updates } : table)),
    );
    setPreviewTable((prev) => (prev?.table_id === tableId ? { ...prev, ...updates } : prev));
    setQrPreviewTable((prev) => (prev?.table_id === tableId ? { ...prev, ...updates } : prev));
  };

  const onToggleStatus = async (tableId: number) => {
    const current = tables.find((table) => table.table_id === tableId);
    if (!current || (current.status !== 0 && current.status !== 1)) {
      toast.error("Unable to change status for this table.");
      return;
    }
    const previousStatus = current.status;
    const nextStatus: StatusFlag = current.status === 1 ? 0 : 1;
    patchTableRow(tableId, { status: nextStatus });

    try {
      const response = await toggleTableStatus(tableId);
      toast.success("Status updated", { description: response.message });
      await refreshTableRow(tableId);
    } catch (error) {
      patchTableRow(tableId, { status: previousStatus });
      toast.error("Status update failed", { description: parseApiError(error).message });
    }
  };

  const onUpdateAvailability = async (tableId: number, isAvailable: StatusFlag) => {
    const current = tables.find((table) => table.table_id === tableId);
    const previousAvailability = current?.is_available;
    patchTableRow(tableId, { is_available: isAvailable });

    try {
      const response = await updateTableAvailability(tableId, isAvailable);
      toast.success("Availability updated", { description: response.message });
      await refreshTableRow(tableId);
    } catch (error) {
      if (previousAvailability === 0 || previousAvailability === 1) {
        patchTableRow(tableId, { is_available: previousAvailability });
      }
      toast.error("Availability update failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const downloadQr = async (table: VendorTable) => {
    try {
      const url = getTableQrImageUrl(table.table_id);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch QR image.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `table-${table.table_number}-qr.png`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error("QR download failed", { description: parseApiError(error).message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-zinc-900">Table Management</h1>
        <Button type="button" onClick={openCreateDialog}>
          Add Table
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <Input
          label="Search"
          placeholder="Table number or capacity"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="table-status-filter">Status Filter</Label>
          <select
            id="table-status-filter"
            className="h-11 border border-black bg-zinc-50 px-3 text-sm"
            value={String(statusFilter)}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(value === "all" ? "all" : Number(value) === 1 ? 1 : 0);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="1">Enabled</option>
            <option value="0">Disabled</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="table-availability-filter">Availability Filter</Label>
          <select
            id="table-availability-filter"
            className="h-11 border border-black bg-zinc-50 px-3 text-sm"
            value={String(availabilityFilter)}
            onChange={(event) => {
              const value = event.target.value;
              setAvailabilityFilter(value === "all" ? "all" : Number(value) === 1 ? 1 : 0);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="1">Available</option>
            <option value="0">Occupied</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void loadTables();
            }}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="border border-zinc-200 bg-white p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Table #</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Loader message="Loading tables..." className="min-h-[80px]" />
                </TableCell>
              </TableRow>
            ) : paginatedTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  No tables found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTables.map((table) => (
                <TableRow key={table.table_id}>
                  <TableCell>{table.table_id}</TableCell>
                  <TableCell>{table.table_number}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>
                    <Badge variant={table.status === 1 ? "default" : "secondary"}>
                      {statusLabel(table.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={table.is_available === 1 ? "default" : "destructive"}>
                      {availabilityLabel(table.is_available)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewTable(table)}
                      >
                        Preview
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          void openEditDialog(table);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void onToggleStatus(table.table_id);
                        }}
                      >
                        {table.status === 1 ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void onUpdateAvailability(
                            table.table_id,
                            table.is_available === 1 ? 0 : 1,
                          );
                        }}
                      >
                        {table.is_available === 1 ? "Mark Occupied" : "Mark Available"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setQrPreviewTable(table)}
                      >
                        QR
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          void onDelete(table.table_id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-600">
        <p>
          Showing {paginatedTables.length} of {filtered.length}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Table" : "Create Table"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Table Number"
              type="text"
              placeholder="T-101"
              value={form.table_number}
              onChange={(event) => setForm((prev) => ({ ...prev, table_number: event.target.value }))}
              disabled={saving}
            />
            <Input
              label="Seating Capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
              disabled={saving}
            />
            <div className="space-y-1.5">
              <Label htmlFor="table-area-type">Area Type</Label>
              <select
                id="table-area-type"
                className="h-11 w-full border border-black bg-zinc-50 px-3 text-sm"
                value={form.area_type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, area_type: event.target.value }))
                }
                disabled={saving}
              >
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="table-status">Status</Label>
              <select
                id="table-status"
                className="h-11 w-full border border-black bg-zinc-50 px-3 text-sm"
                value={String(form.status)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: Number(event.target.value) === 1 ? 1 : 0 }))
                }
                disabled={saving}
              >
                <option value="1">Enabled</option>
                <option value="0">Disabled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="table-availability">Availability</Label>
              <select
                id="table-availability"
                className="h-11 w-full border border-black bg-zinc-50 px-3 text-sm"
                value={String(form.is_available)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_available: Number(event.target.value) === 1 ? 1 : 0,
                  }))
                }
                disabled={saving}
              >
                <option value="1">Available</option>
                <option value="0">Occupied</option>
              </select>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Table" : "Create Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(qrPreviewTable)} onOpenChange={(open) => !open && setQrPreviewTable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Table #{qrPreviewTable?.table_number} QR Code
            </DialogTitle>
          </DialogHeader>
          {qrPreviewTable && (
            <div className="space-y-4">
              <img
                src={getTableQrImageUrl(qrPreviewTable.table_id)}
                alt={`Table ${qrPreviewTable.table_number} QR`}
                className="mx-auto border border-zinc-200 p-2"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void downloadQr(qrPreviewTable);
                  }}
                >
                  Download QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewTable)} onOpenChange={(open) => !open && setPreviewTable(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Table Preview</DialogTitle>
          </DialogHeader>
          {previewTable && (
            <div className="space-y-3 text-sm text-zinc-700">
              <p><strong>ID:</strong> {previewTable.table_id}</p>
              <p><strong>Table Number:</strong> {previewTable.table_number}</p>
              <p><strong>Seating Capacity:</strong> {previewTable.capacity}</p>
              <p><strong>Area Type:</strong> {previewTable.area_type || "-"}</p>
              <p><strong>Status:</strong> {statusLabel(previewTable.status)}</p>
              <p><strong>Availability:</strong> {availabilityLabel(previewTable.is_available)}</p>
              <div>
                <p className="mb-2"><strong>QR Preview:</strong></p>
                <img
                  src={getTableQrImageUrl(previewTable.table_id)}
                  alt={`Table ${previewTable.table_number} QR`}
                  className="mx-auto border border-zinc-200 p-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {previewTable && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void downloadQr(previewTable);
                }}
              >
                Download QR
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setPreviewTable(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

