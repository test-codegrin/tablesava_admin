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

const PAGE_SIZE = 10;

type TableForm = {
  table_number: string;
  capacity: string;
  status: StatusFlag;
  is_available: StatusFlag;
};

const createInitialForm = (): TableForm => ({
  table_number: "",
  capacity: "",
  status: 1,
  is_available: 1,
});

const statusLabel = (status: StatusFlag | undefined) => (status === 0 ? "Disabled" : "Enabled");
const availabilityLabel = (flag: StatusFlag | undefined) => (flag === 0 ? "Occupied" : "Available");

export default function TableManagement() {
  const [tables, setTables] = useState<VendorTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorTable | null>(null);
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
      setTables(response.tables);
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
    const tableNumber = Number(form.table_number);
    const capacity = Number(form.capacity);

    if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
      throw new Error("Table number must be a positive number.");
    }
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error("Capacity must be a positive number.");
    }
    if (!(form.status === 0 || form.status === 1)) {
      throw new Error("Status must be 0 or 1.");
    }
    if (!(form.is_available === 0 || form.is_available === 1)) {
      throw new Error("Availability must be 0 or 1.");
    }
  };

  const buildPayload = (): UpsertTablePayload => ({
    table_number: Number(form.table_number),
    capacity: Number(form.capacity),
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

  const onToggleStatus = async (tableId: number) => {
    try {
      const response = await toggleTableStatus(tableId);
      toast.success("Status updated", { description: response.message });
      await loadTables();
    } catch (error) {
      toast.error("Status update failed", { description: parseApiError(error).message });
    }
  };

  const onUpdateAvailability = async (tableId: number, isAvailable: StatusFlag) => {
    try {
      const response = await updateTableAvailability(tableId, isAvailable);
      toast.success("Availability updated", { description: response.message });
      await loadTables();
    } catch (error) {
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
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  Loading tables...
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
                        Toggle Status
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
              type="number"
              min={1}
              value={form.table_number}
              onChange={(event) => setForm((prev) => ({ ...prev, table_number: event.target.value }))}
              disabled={saving}
            />
            <Input
              label="Capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
              disabled={saving}
            />
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
                <option value="1">Enabled (1)</option>
                <option value="0">Disabled (0)</option>
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
                <option value="1">Available (1)</option>
                <option value="0">Occupied (0)</option>
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
    </div>
  );
}

