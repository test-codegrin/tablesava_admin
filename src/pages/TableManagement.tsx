import { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBuilding4Line,
  RiEdit2Line,
  RiQrCodeLine,
  RiSearchLine,
} from "@remixicon/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { parseApiError } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loader from "@/pages/Loader";
import {
  createTable,
  deleteTable,
  getTableById,
  getTableQrImageUrl,
  getTables,
  updateTable,
} from "@/services/tableService";
import type { StatusFlag, UpsertTablePayload, VendorTable } from "@/types/admin";

type ScreenMode = "list" | "editor";
type EditorMode = "create" | "edit";
type AvailabilityViewFilter = "all" | "available" | "occupied" | "service";
type AvailabilityStateChoice = "available" | "occupied" | "service";
type EditorAvailabilityChoice = "available" | "occupied" | "service";

type TableForm = {
  table_number: string;
  capacity: string;
  area_type: string;
  status: StatusFlag;
  is_available: StatusFlag;
};

const PAGE_SIZE = 5;

const areaOptions = [
  { value: "main_hall", label: "Main Hall" },
  { value: "terrace", label: "Terrace" },
  { value: "bar_area", label: "Bar Area" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
] as const;

const createInitialForm = (): TableForm => ({
  table_number: "",
  capacity: "",
  area_type: "main_hall",
  status: 1,
  is_available: 1,
});

const normalizeAreaType = (value?: string | null) => (value?.trim() || "main_hall").toLowerCase();

const getAreaLabel = (value?: string | null) => {
  const normalized = normalizeAreaType(value);
  const known = areaOptions.find((option) => option.value === normalized);
  if (known) {
    return known.label;
  }
  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getAvailabilityState = (table: Pick<VendorTable, "status" | "is_available">): AvailabilityStateChoice =>
  table.status === 0 ? "service" : table.is_available === 1 ? "available" : "occupied";

const statusLabel = (status?: StatusFlag) => (status === 1 ? "ACTIVE" : "INACTIVE");
const availabilityLabel = (state: AvailabilityStateChoice) =>
  state === "available" ? "Available" : state === "occupied" ? "Occupied" : "Maintenance";

const availabilityColorClass = (state: AvailabilityStateChoice) =>
  state === "available"
    ? "text-[#209b4a]"
    : state === "occupied"
      ? "text-[#d1641d]"
      : "text-[#93a0b3]";

const statusBadgeClass = (status?: StatusFlag) =>
  status === 1
    ? "border border-[#16A34A] text-[#15803D]"
    : "border border-[#E0C0B1] text-[#94A3B8]";

const orangeButtonClass =
  "h-10.5 rounded-none border border-[#9a3412] bg-[#f97316] px-4 text-xs uppercase tracking-[0.07em] text-white hover:bg-[#de5b15]";
const neutralButtonClass =
  "h-10.5 rounded-none border border-[#e8ccb3] bg-white px-4 text-xs uppercase tracking-[0.07em] text-[#6f5d4f] hover:bg-[#f8ede2]";

export default function TableManagement() {
  const navigate = useNavigate();
  const [screenMode, setScreenMode] = useState<ScreenMode>("list");
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingTableId, setEditingTableId] = useState<number | null>(null);

  const [tables, setTables] = useState<VendorTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TableForm>(createInitialForm());
  const [formBaseline, setFormBaseline] = useState(JSON.stringify(createInitialForm()));
  const [formError, setFormError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<"all" | string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityViewFilter>("all");
  const [page, setPage] = useState(1);
  const [qrPreviewTable, setQrPreviewTable] = useState<VendorTable | null>(null);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await getTables();
      setTables(
        response.tables.map((table) => ({
          ...table,
          status: table.status ?? 1,
          is_available: table.is_available ?? 1,
        })),
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

  const filteredTables = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tables.filter((table) => {
      const tableArea = normalizeAreaType(table.area_type);
      const tableAvailability = getAvailabilityState(table);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        String(table.table_number).toLowerCase().includes(normalizedSearch) ||
        String(table.capacity).toLowerCase().includes(normalizedSearch) ||
        tableArea.includes(normalizedSearch);

      const matchesArea = areaFilter === "all" || tableArea === areaFilter;
      const matchesAvailability =
        availabilityFilter === "all" || tableAvailability === availabilityFilter;

      return matchesSearch && matchesArea && matchesAvailability;
    });
  }, [areaFilter, availabilityFilter, search, tables]);

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / PAGE_SIZE));

  const paginatedTables = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTables.slice(start, start + PAGE_SIZE);
  }, [filteredTables, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const formIsDirty = useMemo(() => JSON.stringify(form) !== formBaseline, [form, formBaseline]);

  const totalCapacity = useMemo(
    () => tables.reduce((total, table) => total + Number(table.capacity || 0), 0),
    [tables],
  );
  const activeTableCount = useMemo(() => tables.filter((table) => table.status === 1).length, [tables]);
  const occupiedCount = useMemo(
    () => tables.filter((table) => table.status === 1 && table.is_available === 0).length,
    [tables],
  );
  const occupancyPercent =
    activeTableCount === 0 ? 0 : Math.round((occupiedCount / activeTableCount) * 100);
  const qrReadyCount = useMemo(() => tables.filter((table) => Boolean(table.table_id)).length, [tables]);

  const openCreateScreen = () => {
    const next = createInitialForm();
    setEditorMode("create");
    setEditingTableId(null);
    setForm(next);
    setFormBaseline(JSON.stringify(next));
    setFormError(null);
    setScreenMode("editor");
  };

  const openEditScreen = async (table: VendorTable) => {
    setEditorMode("edit");
    setScreenMode("editor");
    setSaving(true);
    setFormError(null);

    try {
      const detail = await getTableById(table.table_id);
      const next: TableForm = {
        table_number: String(detail.table_number),
        capacity: String(detail.capacity),
        area_type: normalizeAreaType(detail.area_type),
        status: detail.status ?? 1,
        is_available: detail.is_available ?? 1,
      };
      setEditingTableId(detail.table_id);
      setForm(next);
      setFormBaseline(JSON.stringify(next));
    } catch (error) {
      setScreenMode("list");
      toast.error("Failed to load table detail", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const backToList = () => {
    if (formIsDirty && !saving) {
      const shouldDiscard = window.confirm("Discard unsaved table changes?");
      if (!shouldDiscard) {
        return;
      }
    }
    setScreenMode("list");
    setEditingTableId(null);
    setFormError(null);
  };

  const redirectToTableList = (force = false) => {
    if (!force && formIsDirty && !saving) {
      const shouldDiscard = window.confirm("Discard unsaved table changes?");
      if (!shouldDiscard) {
        return;
      }
    }
    setScreenMode("list");
    setEditingTableId(null);
    setFormError(null);
    navigate("/tables");
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
      throw new Error("Operational status must be valid.");
    }
    if (!(form.is_available === 0 || form.is_available === 1)) {
      throw new Error("Availability state must be valid.");
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
      const response =
        editorMode === "edit" && editingTableId
          ? await updateTable(editingTableId, buildPayload())
          : await createTable(buildPayload());

      toast.success(editorMode === "edit" ? "Table updated" : "Table created", {
        description: response.message,
      });
      await loadTables();
      redirectToTableList(true);
    } catch (error) {
      toast.error("Table save failed", {
        description: parseApiError(error).message,
      });
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
      setScreenMode("list");
      setEditingTableId(null);
    } catch (error) {
      toast.error("Delete failed", { description: parseApiError(error).message });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setAreaFilter("all");
    setAvailabilityFilter("all");
    setPage(1);
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
      toast.error("QR download failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const editorAvailabilityChoice: EditorAvailabilityChoice =
    form.is_available === 1 ? "available" : "occupied";

  const applyAvailabilityChoice = (choice: EditorAvailabilityChoice) => {
    setForm((prev) => ({
      ...prev,
      is_available: choice === "available" ? 1 : 0,
    }));
  };

  const currentEditingTable = useMemo(
    () => tables.find((table) => table.table_id === editingTableId) || null,
    [editingTableId, tables],
  );

  const renderListScreen = () => (
    <section className="space-y-4 bg-[#fff8f6] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-medium uppercase tracking-[0.08em] text-[#403127]">
            Table Management
          </h1>
          <p className="text-[14px] tracking-[0.06em] text-[#75675d]">Configure and monitor floor layout in real-time.</p>
        </div>
        <Button type="button" className={orangeButtonClass} onClick={openCreateScreen}>
          <RiAddLine className="size-4" />
          Add New Table
        </Button>
      </div>

      <div className="border border-[#efcfb2] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
          <div className="space-y-1.5">
            <p className="text-[15px] font-medium text-[#6f5f53]">Quick Search</p>
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a99280]" />
              <Input
                className="h-10.5 border-[#e8cab0] bg-white pl-9 text-sm"
                placeholder="Search by number or area..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[15px] font-medium text-[#6f5f53]">Area Type</p>
            <Select
              value={areaFilter}
              onValueChange={(value) => {
                setAreaFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 py-5 border-[#e8cab0] bg-white text-sm">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 ">
            <p className="text-[15px] font-medium text-[#6f5f53]">Availability</p>
            <Select
              value={availabilityFilter}
              onValueChange={(value: AvailabilityViewFilter) => {
                setAvailabilityFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 py-5 border-[#e8cab0] bg-white text-sm">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="service">Service / Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button type="button" variant="outline" className={neutralButtonClass} onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-[#efcfb2] bg-white">
        <Table>
          <TableHeader className="bg-[#f8efe7] text-[#5b4e45]">
            <TableRow>
              <TableHead className="w-8 font-bold">
                <Checkbox />
              </TableHead>
              <TableHead className="text-[#7c2d12]">Table Number</TableHead>
              <TableHead className="text-[#7c2d12]">Capacity</TableHead>
              <TableHead className="text-[#7c2d12]">Area Type</TableHead>
              <TableHead className="text-[#7c2d12]">Status</TableHead>
              <TableHead className="text-[#7c2d12]">Availability</TableHead>
              <TableHead className="text-[#7c2d12] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border border-[#efcfb2]">
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Loader message="Loading tables..." className="min-h-20" />
                </TableCell>
              </TableRow>
            ) : paginatedTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-[#9a8b7f]">
                  No tables found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTables.map((table) => {
                const availabilityState = getAvailabilityState(table);
                return (
                  <TableRow key={table.table_id} className="border-b border-[#f2e4d7] ">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium text-[#3d312a]">{table.table_number}</TableCell>
                    <TableCell>
                      <span className="inline-flex min-w-8 justify-center bg-[#f2ddd0] px-1.5 py-1 text-xs font-semibold text-[#6d5d53]">
                        {String(table.capacity).padStart(2, "0")}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#584a41]">{getAreaLabel(table.area_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-none px-2 py-0.5 text-[10px]  ${statusBadgeClass(table.status)}`}>
                        {statusLabel(table.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${availabilityColorClass(availabilityState)}`}>
                      {availabilityLabel(availabilityState)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="h-7 rounded-none px-2 text-[11px] uppercase tracking-[0.06em] text-[#66574b] hover:bg-[#fff2e6]"
                          onClick={() => setQrPreviewTable(table)}
                        >
                          <RiQrCodeLine className="size-4" /> View QR
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="h-7 rounded-none px-2 text-[11px] uppercase tracking-[0.06em] text-[#66574b] hover:bg-[#fff2e6]"
                          onClick={() => {
                            void openEditScreen(table);
                          }}
                        >
                          <RiEdit2Line className="size-4" /> Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="py-3.5 bg-[#fff1eb] flex flex-wrap items-center justify-between gap-3 px-2 text-[15px] text-[#74665b]">
          <p>
            Showing {paginatedTables.length} of {filteredTables.length} tables
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              className="rounded-none border-[#e8cab0] hover:bg-[#f8ede2]"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <RiArrowLeftSLine className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
              const pageNumber = index + 1;
              const active = pageNumber === page;
              return (
                <Button
                  key={pageNumber}
                  type="button"
                  size="icon-xs"
                  className={`rounded-none border ${active
                      ? "border-[#f36c21] bg-[#f36c21] text-white p-4"
                      : "border-[#e8cab0] bg-white text-[#695a4e] hover:bg-[#f8ede2]"
                    }`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              className="rounded-none border-[#e8cab0] hover:bg-[#f8ede2]"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <RiArrowRightSLine className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[#efd1b4] bg-white p-4">
          <p className="text-[14px] uppercase tracking-[0.07em] text-[#847264]">Total Capacity</p>
          <p className="mt-1 text-[16px] font-semibold uppercase text-[#cf5f1e]">{totalCapacity} Seats</p>
        </div>
        <div className="border border-[#efd1b4] bg-white p-4">
          <p className="text-[14px] uppercase tracking-[0.07em] text-[#847264]">Active Tables</p>
          <p className="mt-1 text-[16px] font-semibold uppercase text-[#cf5f1e]">{activeTableCount} / {tables.length}</p>
        </div>
        <div className="border border-[#efd1b4] bg-white p-4">
          <p className="text-[14px] uppercase tracking-[0.07em] text-[#847264]">Current Occupancy</p>
          <p className="mt-1 text-[16px] font-semibold uppercase text-[#cf5f1e]">{occupancyPercent}%</p>
        </div>
        <div className="border border-[#efd1b4] bg-white p-4">
          <p className="text-[14px] uppercase tracking-[0.07em] text-[#847264]">QR Ready Tables</p>
          <p className="mt-1 text-[16px] font-semibold uppercase text-[#cf5f1e]">{qrReadyCount}</p>
        </div>
      </div>
    </section>
  );

  const renderEditorScreen = () => (
    <section className="mx-auto w-full max-w-245 space-y-4 bg-[#fff8f6] p-6">
      <div className="space-y-0.5 ml-28">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#c56524]">
          <button
            type="button"
            className="hover:text-[#a65012] uppercase"
            onClick={() => redirectToTableList()}
          >
            Table Management
          </button>
          <span>/</span>
          <span>{editorMode === "edit" ? "Edit" : "Create"}</span>
        </div>
        <h2 className="text-[26px] font-semibold text-[#2e241d]">
          {editorMode === "edit" ? "Edit Table" : "Add New Table"}
        </h2>
      </div>

      <div className="mx-auto w-full max-w-190 border border-[#efcfb2] text-[13px] tracking-[0.06em] text-[#584237] uppercase bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Table Number"
            className="h-10 border-[#e8cab0] bg-white"
            placeholder="T-04"
            value={form.table_number}
            onChange={(event) => setForm((prev) => ({ ...prev, table_number: event.target.value }))}
            disabled={saving}
          />
          <Input
            label="Seating Capacity"
            type="number"
            min={1}
            className="h-10 border-[#e8cab0] bg-white"
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="mt-8 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[#5d4f45]">Area Type</p>
          <Select
            value={form.area_type}
            onValueChange={(value) => setForm((prev) => ({ ...prev, area_type: value }))}
            disabled={saving}
          >
            <SelectTrigger className="h-10 border-[#e8cab0] py-5 bg-white text-sm">
              <SelectValue placeholder="Select area type" />
            </SelectTrigger>
            <SelectContent>
              {areaOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 border border-[#efdfd2] bg-[#f8f0e8] p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center border border-[#e7c8ad] bg-white text-[#c76426]">
              <RiBuilding4Line className="size-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#bf5e1f] capitalize">Table {form.table_number || "—"}</p>
              <p className="text-[13px] text-[#7a6a5e] capitalize">
                Located in {getAreaLabel(form.area_type)} • Capacity: {form.capacity || "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[#efd9c6] pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#5d4f45]">
                Operational Status
              </p>
              <p className="text-[13px] mt-1 capitalize text-[#8a7a6d]">Active tables can receive bookings</p>
            </div>
            <Switch
              checked={form.status === 1}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  status: checked ? 1 : 0,
                }))
              }
              disabled={saving}
            />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d4f45]">Availability State</p>
          <div className="grid grid-cols-2 border border-[#efd0b4]">
            {(["available", "occupied"] as const).map((choice) => {
              const active = editorAvailabilityChoice === choice;
              return (
                <Button
                  key={choice}
                  type="button"
                  variant="ghost"
                  className={`h-11 rounded-none border-r border-[#efd0b4] text-xs uppercase tracking-[0.07em] last:border-r-0 ${active
                      ? "bg-[#a95312] text-white hover:bg-[#94490f]"
                      : "bg-white text-[#6e5d50] hover:bg-[#f9f0e8]"
                    }`}
                  onClick={() => applyAvailabilityChoice(choice)}
                  disabled={saving}
                >
                  {choice}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid h-22 place-items-center border border-[#e8d6c6] bg-[#f4f4f4] text-xs font-semibold uppercase tracking-[0.07em] text-[#ab9e92]">
          Current: {getAreaLabel(form.area_type)} - Zone B
        </div>

        {formError && (
          <div className="mt-3 border border-[#f0b8b8] bg-[#fff3f3] px-3 py-2 text-sm text-[#b64545]">
            {formError}
          </div>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-190 grid-cols-1 gap-2 border-t border-[#efcfb2] pt-3 sm:grid-cols-2">
        <Button
          type="button"
          className="h-11 rounded-none border border-[#a65111] bg-[#a65111] text-sm uppercase tracking-[0.07em] text-white hover:bg-[#93480f]"
          onClick={() => void onSave()}
          disabled={saving}
        >
          {saving ? "Saving..." : editorMode === "edit" ? "Update Table" : "Create Table"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-none border-[#efcfb2] text-sm uppercase tracking-[0.07em] text-[#6f5d4f] hover:bg-[#f8ede2]"
          onClick={backToList}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>

      {editorMode === "edit" && editingTableId && (
        <div className="mx-auto flex w-full max-w-190 justify-end">
          <Button
            type="button"
            variant="destructive"
            className="h-9 rounded-none border border-[#efb6b6] bg-[#fff3f3] px-3 text-xs uppercase tracking-[0.07em] text-[#b64545] hover:bg-[#ffeaea]"
            onClick={() => {
              void onDelete(editingTableId);
            }}
            disabled={saving}
          >
            Delete Table
          </Button>
        </div>
      )}

      {currentEditingTable && (
        <div className="mx-auto w-full max-w-190">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-none border-[#e8ccb3] text-xs uppercase tracking-[0.07em] text-[#66574b] hover:bg-[#f8ede2]"
            onClick={() => setQrPreviewTable(currentEditingTable)}
          >
            <RiQrCodeLine className="size-4" />
            View QR
          </Button>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-4 text-[#3f3025] [&_button]:cursor-pointer [&_input]:cursor-pointer [&_label]:cursor-pointer [&_select]:cursor-pointer [&_textarea]:cursor-pointer">
      {screenMode === "list" ? renderListScreen() : renderEditorScreen()}

      <Dialog open={Boolean(qrPreviewTable)} onOpenChange={(open) => !open && setQrPreviewTable(null)}>
        <DialogContent className="gap-0 w-99.5 overflow-hidden rounded-none border-2 border-[#9D4300] p-0">
          {/* Orange header bar */}
          <DialogHeader className="flex flex-row items-center justify-between bg-[#F97316] px-4 py-0 h-11 space-y-0 border-b border-[#9D4300]">
            <DialogTitle className="text-[14px] font-light uppercase tracking-widest text-white ">
              Preview QR Code
            </DialogTitle>
          </DialogHeader>

          {qrPreviewTable && (
            <>
              <div className="px-6 pt-6 pb-0 space-y-4">
                {/* Table label */}
                <div className="text-center space-y-1">
                  <p className="text-[13px] uppercase tracking-widest text-[#9a8b7f]">Currently viewing</p>
                  <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#9D4300]">
                    Table {qrPreviewTable.table_number}
                  </p>
                </div>

                {/* QR image with corner brackets */}
                <div className="relative max-w-73 mx-auto border border-[#9D4300] p-[16px]">
                  {/* Corner brackets */}
                  <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#9D4300]" />
                  <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#9D4300]" />
                  <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#9D4300]" />
                  <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#9D4300]" />

                  <div className="bg-[#1a1a1a] p-3 flex items-center justify-center">
                    <img
                      src={getTableQrImageUrl(qrPreviewTable.table_id)}
                      alt={`Table ${qrPreviewTable.table_number} QR`}
                      className="w-40 h-50 object-contain"
                    />
                  </div>
                </div>

                {/* Direct link */}
                <p className="text-[14px] text-[#584237] text-center leading-relaxed">
                  "Direct link to:<br />
                  menu.scanorderdone.com/table/{String(qrPreviewTable.table_number).toLowerCase()}"
                </p>

                {/* Full-width download button */}
                <button
                  type="button"
                  className="w-full cursor-pointer h-11 bg-[#F97316] text-white text-[14px] font-light uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors my-4"
                  onClick={() => { void downloadQr(qrPreviewTable); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PNG
                </button>
              </div>

              {/* Footer with format info */}
              <div className="flex justify-between border-t bg-[#FFF1EB] border-[#E0C0B1] px-4 py-2.5 mt-3">
                <span className="text-[12px] uppercase tracking-[0.07em] text-[#584237]">Format: 2048 × 2048 px</span>
                <span className="text-[12px] uppercase tracking-[0.07em] text-[#584237]">ECC: Level H</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
