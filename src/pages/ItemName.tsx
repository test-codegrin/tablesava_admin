import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiImageAddLine,
  RiRefreshLine,
  RiSearchLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { parseApiError } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/pages/Loader";
import { getCategories } from "@/services/categoryService";
import {
  createItem,
  deleteItem,
  filterItemsLocally,
  getCategoryItems,
  getItems,
  patchItemStatus,
  updateItem,
} from "@/services/itemService";
import type { Category, Item, ItemOption, ItemOptionGroup, StatusFlag } from "@/types/admin";

type ScreenMode = "list" | "create" | "edit";

type ItemOptionForm = ItemOption & {
  status?: StatusFlag;
};

type ItemOptionGroupForm = Omit<ItemOptionGroup, "options"> & {
  options: ItemOptionForm[];
};

type ItemForm = {
  categories_id: number;
  name: string;
  description: string;
  price: string;
  status: StatusFlag;
  photo: File | null;
  existing_photo_url: string | null;
  option_groups: ItemOptionGroupForm[];
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const emptyOption = (): ItemOptionForm => ({
  name: "",
  price_delta: 0,
  status: 1,
});

const emptyOptionGroup = (): ItemOptionGroupForm => ({
  name: "",
  multiple_select: 0,
  is_required: 0,
  status: 1,
  options: [emptyOption()],
});

const createInitialForm = (): ItemForm => ({
  categories_id: 0,
  name: "",
  description: "",
  price: "",
  status: 1,
  photo: null,
  existing_photo_url: null,
  option_groups: [emptyOptionGroup()],
});

const toFormFromItem = (item: Item): ItemForm => {
  const optionGroups = item.option_groups ?? [];

  return {
    categories_id: item.categories_id,
    name: item.name,
    description: item.description,
    price: String(item.price),
    status: item.status,
    photo: null,
    existing_photo_url: item.photo_url ?? null,
    option_groups:
      optionGroups.length > 0
        ? optionGroups.map((group) => ({
            group_id: group.group_id,
            name: group.name,
            multiple_select: group.multiple_select,
            is_required: group.is_required,
            status: group.status ?? 1,
            is_deleted: false,
            options: group.options.map((option) => ({
              option_id: option.option_id,
              name: option.name,
              price_delta: option.price_delta,
              status: 1,
              is_deleted: false,
            })),
          }))
        : [emptyOptionGroup()],
  };
};

const serializeForm = (form: ItemForm) =>
  JSON.stringify({
    categories_id: form.categories_id,
    name: form.name.trim(),
    description: form.description.trim(),
    price: form.price,
    status: form.status,
    existing_photo_url: form.existing_photo_url ?? "",
    photo_selected: Boolean(form.photo),
    option_groups: form.option_groups.map((group) => ({
      group_id: group.group_id ?? null,
      name: group.name.trim(),
      multiple_select: group.multiple_select,
      is_required: group.is_required,
      status: group.status ?? 1,
      is_deleted: group.is_deleted === true,
      options: group.options.map((option) => ({
        option_id: option.option_id ?? null,
        name: option.name.trim(),
        price_delta: Number(option.price_delta),
        status: option.status ?? 1,
        is_deleted: option.is_deleted === true,
      })),
    })),
  });

const statusLabel = (status: StatusFlag) => (status === 1 ? "ACTIVE" : "OUT OF STOCK");

const asCurrency = (value: number) => `$${value.toFixed(2)}`;

const asDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const accentButtonClass =
  "h-10 rounded-none border border-[#f36c21] bg-[#f36c21] px-4 text-xs uppercase tracking-[0.07em] text-white hover:bg-[#df5d15]";
const outlineButtonClass =
  "h-10 rounded-none border border-[#eac8aa] bg-white px-4 text-xs uppercase tracking-[0.07em] text-[#735f4f] hover:bg-[#f8eee4]";

export default function ItemName() {
  const [screenMode, setScreenMode] = useState<ScreenMode>("list");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemForm>(createInitialForm());
  const [formBaseline, setFormBaseline] = useState(serializeForm(createInitialForm()));
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | number>("all");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = useState<string | null>(null);
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryResponse, itemResponse] = await Promise.all([getCategories(), getItems()]);
      setCategories(categoryResponse.categories);
      setItems(itemResponse.items);
    } catch (error) {
      toast.error("Failed to load menu items", {
        description: parseApiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshItems = async () => {
    const response = await getItems();
    setItems(response.items);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.photo) {
      setSelectedPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.photo);
    setSelectedPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.photo]);

  const filteredBySearchAndStatus = useMemo(
    () => filterItemsLocally(items, search, statusFilter),
    [items, search, statusFilter],
  );

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? filteredBySearchAndStatus
        : filteredBySearchAndStatus.filter((item) => item.categories_id === categoryFilter),
    [categoryFilter, filteredBySearchAndStatus],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const activeItems = items.filter((item) => item.status === 1).length;
  const menuHealthScore = items.length === 0 ? 0 : Math.round((activeItems / items.length) * 100);
  const formIsDirty = useMemo(() => serializeForm(form) !== formBaseline, [form, formBaseline]);

  const visibleGroups = useMemo(
    () => form.option_groups.filter((group) => !group.is_deleted),
    [form.option_groups],
  );

  const imagePreviewUrl = selectedPhotoPreviewUrl || form.existing_photo_url || null;

  const getCategoryName = (categoryId: number) =>
    categories.find((category) => category.categories_id === categoryId)?.name || "-";

  const openCreateScreen = () => {
    const next = createInitialForm();
    setScreenMode("create");
    setEditing(null);
    setForm(next);
    setFormBaseline(serializeForm(next));
    setFormError(null);
    setCollapsedGroupKeys(new Set());
  };

  const openEditScreen = async (item: Item) => {
    const initial = toFormFromItem(item);
    setScreenMode("edit");
    setEditing(item);
    setForm(initial);
    setFormBaseline(serializeForm(initial));
    setFormError(null);
    setDetailLoading(true);
    setCollapsedGroupKeys(new Set());

    try {
      const response = await getCategoryItems(item.categories_id);
      const detailedItem = response.items.find((entry) => entry.item_id === item.item_id);
      if (detailedItem) {
        const detailedForm = toFormFromItem(detailedItem);
        setEditing(detailedItem);
        setForm(detailedForm);
        setFormBaseline(serializeForm(detailedForm));
      }
    } catch (error) {
      toast.error("Could not load detailed item", {
        description: parseApiError(error).message,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const backToList = () => {
    if ((screenMode === "create" || screenMode === "edit") && formIsDirty && !saving) {
      const shouldDiscard = window.confirm("Discard unsaved item changes?");
      if (!shouldDiscard) {
        return;
      }
    }

    setScreenMode("list");
    setEditing(null);
    setFormError(null);
    setCollapsedGroupKeys(new Set());
  };

  const updateGroup = (
    groupIndex: number,
    updater: (group: ItemOptionGroupForm) => ItemOptionGroupForm,
  ) => {
    setForm((prev) => ({
      ...prev,
      option_groups: prev.option_groups.map((group, index) =>
        index === groupIndex ? updater(group) : group,
      ),
    }));
  };

  const updateOption = (
    groupIndex: number,
    optionIndex: number,
    updater: (option: ItemOptionForm) => ItemOptionForm,
  ) => {
    updateGroup(groupIndex, (group) => ({
      ...group,
      options: group.options.map((option, index) => (index === optionIndex ? updater(option) : option)),
    }));
  };

  const removeOptionGroup = (groupIndex: number) => {
    setForm((prev) => {
      const target = prev.option_groups[groupIndex];
      if (!target) {
        return prev;
      }

      if (typeof target.group_id === "number") {
        return {
          ...prev,
          option_groups: prev.option_groups.map((group, index) =>
            index === groupIndex ? { ...group, is_deleted: true } : group,
          ),
        };
      }

      return {
        ...prev,
        option_groups: prev.option_groups.filter((_, index) => index !== groupIndex),
      };
    });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    updateGroup(groupIndex, (group) => {
      const target = group.options[optionIndex];
      if (!target) {
        return group;
      }

      if (typeof target.option_id === "number") {
        return {
          ...group,
          options: group.options.map((option, index) =>
            index === optionIndex ? { ...option, is_deleted: true } : option,
          ),
        };
      }

      return {
        ...group,
        options: group.options.filter((_, index) => index !== optionIndex),
      };
    });
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const validateForm = () => {
    if (!form.categories_id) {
      throw new Error("Category is required.");
    }

    if (!form.name.trim()) {
      throw new Error("Item name is required.");
    }

    const parsedPrice = Number(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new Error("Price must be a valid non-negative number.");
    }

    const nonDeletedGroups = form.option_groups.filter((group) => !group.is_deleted);
    if (nonDeletedGroups.length === 0) {
      throw new Error("At least one customization group is required.");
    }

    nonDeletedGroups.forEach((group, groupIdx) => {
      if (!group.name.trim()) {
        throw new Error(`Customization group ${groupIdx + 1} name is required.`);
      }

      const nonDeletedOptions = group.options.filter((option) => !option.is_deleted);
      if (nonDeletedOptions.length === 0) {
        throw new Error(`Customization group ${groupIdx + 1} must contain at least one choice.`);
      }

      nonDeletedOptions.forEach((option, optionIdx) => {
        if (!option.name.trim()) {
          throw new Error(`Choice ${optionIdx + 1} in group ${groupIdx + 1} must have a name.`);
        }
      });
    });
  };

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
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        status: form.status,
        photo: form.photo,
        option_groups: form.option_groups,
      };

      const response = editing
        ? await updateItem(editing.item_id, payload, "patch")
        : await createItem(form.categories_id, payload, "replace");

      toast.success(editing ? "Item updated" : "Item created", {
        description: response.message,
      });

      await refreshItems();
      setScreenMode("list");
      setEditing(null);
      setFormError(null);
      setCollapsedGroupKeys(new Set());
    } catch (error) {
      toast.error("Item save failed", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (itemId: number) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    try {
      const response = await deleteItem(itemId);
      toast.success("Item deleted", { description: response.message });
      await refreshItems();
      if (editing?.item_id === itemId) {
        setScreenMode("list");
        setEditing(null);
      }
    } catch (error) {
      toast.error("Delete failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const onToggleStatus = async (item: Item) => {
    const nextStatus: StatusFlag = item.status === 1 ? 0 : 1;
    try {
      const response = await patchItemStatus(item.item_id, nextStatus);
      toast.success("Item status updated", { description: response.message });
      await refreshItems();
    } catch (error) {
      toast.error("Status update failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const onSelectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, photo: selected }));
  };

  const renderListScreen = () => (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.06em] text-[#2f261f]">Menu Items</h1>
          <p className="text-sm text-[#7b6b60]">Manage your digital menu, pricing, and availability states.</p>
        </div>
        <Button type="button" onClick={openCreateScreen} className={accentButtonClass}>
          <RiAddLine className="size-4" />
          Add Item
        </Button>
      </div>

      <div className="space-y-4 border border-[#efd1b4] bg-[#fcf7f2] p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_150px_auto]">
          <div className="relative">
            <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#b09076]" />
            <Input
              className="h-10 border-[#e7c8ad] bg-white pl-9 text-sm"
              placeholder="Search menu items..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={String(categoryFilter)}
            onValueChange={(value) => {
              setCategoryFilter(value === "all" ? "all" : Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-[#e7c8ad] bg-white text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.categories_id} value={String(category.categories_id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(statusFilter)}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? "all" : Number(value) === 1 ? 1 : 0);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-[#e7c8ad] bg-white text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Out Of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-[#e7c8ad] bg-white text-sm">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" className={outlineButtonClass} onClick={() => void loadData()}>
            <RiRefreshLine className="size-4" />
            Refresh
          </Button>
        </div>

        <div className="border border-[#efdac8] bg-white">
          <Table>
            <TableHeader className="bg-[#f8f0e8] text-[#67584d]">
              <TableRow>
                <TableHead className="w-9">
                  <Checkbox />
                </TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Loader message="Loading items..." className="min-h-[100px]" />
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[#9d8e82]">
                    No menu items found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow key={item.item_id} className="border-b border-[#f3e8de] hover:bg-[#fff8f2]">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-10 overflow-hidden border border-[#efdfd0] bg-[#f8f1ea]">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-[10px] text-[#ae9883]">IMG</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#3d312a]">{item.name}</p>
                          <p className="text-[11px] text-[#a6907e]">ID: MENU-{String(item.item_id).padStart(3, "0")}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#5e4f44]">{getCategoryName(item.categories_id)}</TableCell>
                    <TableCell className="font-medium text-[#3f3025]">{asCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === 1 ? "default" : "secondary"}
                        className={`rounded-none px-2 py-0.5 text-[10px] tracking-[0.05em] ${
                          item.status === 1
                            ? "border border-[#b8dfc5] bg-[#ecfff2] text-[#2e9c4f]"
                            : "border border-[#f0dcc5] bg-[#fff5e9] text-[#c67832]"
                        }`}
                      >
                        {statusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#6e6155]">{asDate(item.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="outline"
                          className="rounded-none border-[#e7cbb3] text-[#9f6d47] hover:bg-[#fff2e7]"
                          onClick={() => void openEditScreen(item)}
                        >
                          <RiEdit2Line className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="outline"
                          className="rounded-none border-[#e7cbb3] text-[#8d664f] hover:bg-[#fff2e7]"
                          onClick={() => void onToggleStatus(item)}
                        >
                          <span className="text-[10px] font-semibold uppercase">{item.status === 1 ? "Off" : "On"}</span>
                        </Button>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="outline"
                          className="rounded-none border-[#efccb8] text-[#b8482e] hover:bg-[#fff0ea]"
                          onClick={() => void onDelete(item.item_id)}
                        >
                          <RiDeleteBinLine className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#7d6b5c]">
          <p>
            Showing {(page - 1) * pageSize + (paginatedItems.length === 0 ? 0 : 1)}-
            {(page - 1) * pageSize + paginatedItems.length} of {filtered.length} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-none border-[#e7c8ad] hover:bg-[#f8eee4]"
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
              className="rounded-none border-[#e7c8ad] hover:bg-[#f8eee4]"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="border border-[#efd1b4] bg-[#fffdfa] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[#9b8a7b]">Total Items</p>
          <p className="mt-1 text-3xl font-semibold text-[#3a2f27]">{items.length}</p>
        </div>
        <div className="border border-[#efd1b4] bg-[#fffdfa] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[#9b8a7b]">Active Items</p>
          <p className="mt-1 text-3xl font-semibold text-[#2f9b4b]">{activeItems}</p>
        </div>
        <div className="border border-[#f36c21] bg-[#f36c21] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.08em] text-[#ffe2cd]">Menu Health Score</p>
          <p className="mt-1 text-3xl font-semibold">{menuHealthScore}%</p>
        </div>
      </div>
    </section>
  );

  const renderEditorScreen = () => {
    const isEdit = screenMode === "edit";

    return (
      <section className="space-y-0 border border-[#efd1b4] bg-[#fffdfa]">
        {isEdit && formIsDirty && (
          <div className="flex items-center justify-between border-b border-[#f36c21] bg-[#f36c21] px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white">
            <span>You have unsaved changes</span>
            <Button
              type="button"
              size="xs"
              className="h-7 rounded-none border border-[#f9c7a4] bg-[#fff5ed] px-3 text-[#b95519] hover:bg-white"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "Saving..." : "Update Item"}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#efd8c6] px-4 py-4">
          <div>
            <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-[#3f3129]">
              {isEdit ? "Edit Menu Item" : "Add Menu Item"}
            </h2>
            <p className="text-sm text-[#8f7b6b]">
              {isEdit
                ? `ID: MENU-${String(editing?.item_id ?? 0).padStart(3, "0")} | Last update: ${asDate(editing?.updated_at)}`
                : "Configure a new item for your digital terminal catalog."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className={outlineButtonClass} onClick={backToList} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" className={accentButtonClass} onClick={() => void onSave()} disabled={saving || detailLoading}>
              {saving ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </div>

        {detailLoading ? (
          <div className="p-8">
            <Loader message="Loading item details..." className="min-h-[180px]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <section className="border border-[#efd8c6] bg-[#fcf7f2] p-3">
                <div className="mb-3 flex items-center justify-between border-b border-[#efddce] pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a65e29]">Basic Details</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#b9a494]">Required Info</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f5f54]">Category</p>
                    <Select
                      value={form.categories_id ? String(form.categories_id) : "__none__"}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, categories_id: value === "__none__" ? 0 : Number(value) }))
                      }
                      disabled={saving || isEdit}
                    >
                      <SelectTrigger className="h-10 border-[#e7c8ad] bg-white text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.categories_id} value={String(category.categories_id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    label="Item Name"
                    className="h-10 border-[#e7c8ad] bg-white text-sm"
                    placeholder="e.g., Spicy Miso Ramen"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    disabled={saving}
                  />

                  <div className="md:col-span-2">
                    <Textarea
                      label="Description"
                      className="min-h-24 border-[#e7c8ad] bg-white text-sm"
                      placeholder="Describe the flavors and ingredients..."
                      value={form.description}
                      onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <Input
                    label="Price ($)"
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-10 border-[#e7c8ad] bg-white text-sm"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    disabled={saving}
                  />

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f5f54]">Item Status</p>
                    <div className="flex h-10 items-center gap-3 border border-[#e7c8ad] bg-white px-3">
                      <Switch
                        checked={form.status === 1}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({ ...prev, status: checked ? 1 : 0 }))
                        }
                        disabled={saving}
                      />
                      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#56473d]">
                        {form.status === 1 ? "Active On Menu" : "Out Of Stock"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border border-[#efd8c6] bg-[#fcf7f2] p-3">
                <div className="mb-3 flex items-center justify-between border-b border-[#efddce] pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a65e29]">Customization Groups</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-none border-[#e7c8ad] bg-white px-3 text-[11px] uppercase tracking-[0.07em] text-[#a35b27] hover:bg-[#fff4ea]"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        option_groups: [...prev.option_groups, emptyOptionGroup()],
                      }))
                    }
                    disabled={saving}
                  >
                    <RiAddLine className="size-4" /> Add Group
                  </Button>
                </div>

                <div className="space-y-3">
                  {visibleGroups.map((group) => {
                    const groupIndex = form.option_groups.findIndex((candidate) => candidate === group);
                    const groupKey = `${group.group_id ?? "new"}-${groupIndex}`;
                    const visibleOptions = group.options.filter((option) => !option.is_deleted);
                    const groupCollapsed = collapsedGroupKeys.has(groupKey);

                    return (
                      <div key={groupKey} className="border border-[#efdccd] bg-white p-2.5">
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <Input
                            label="Group Name"
                            className="h-9 border-[#e7c8ad] text-sm"
                            value={group.name}
                            onChange={(event) =>
                              updateGroup(groupIndex, (current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            disabled={saving}
                          />
                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="outline"
                              className="h-9 rounded-none border-[#efcdb8] text-[#b54b2d] hover:bg-[#fff1ea]"
                              onClick={() => removeOptionGroup(groupIndex)}
                              disabled={saving}
                            >
                              <RiDeleteBinLine className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="flex items-center justify-between border border-[#ecd3bf] px-2.5 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6d5d52]">Multiple</span>
                            <Switch
                              checked={group.multiple_select === 1}
                              onCheckedChange={(checked) =>
                                updateGroup(groupIndex, (current) => ({
                                  ...current,
                                  multiple_select: checked ? 1 : 0,
                                }))
                              }
                              disabled={saving}
                            />
                          </div>
                          <div className="flex items-center justify-between border border-[#ecd3bf] px-2.5 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6d5d52]">Required</span>
                            <Switch
                              checked={group.is_required === 1}
                              onCheckedChange={(checked) =>
                                updateGroup(groupIndex, (current) => ({
                                  ...current,
                                  is_required: checked ? 1 : 0,
                                }))
                              }
                              disabled={saving}
                            />
                          </div>
                          <div className="flex items-center justify-between border border-[#ecd3bf] px-2.5 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6d5d52]">Status</span>
                            <Switch
                              checked={(group.status ?? 1) === 1}
                              onCheckedChange={(checked) =>
                                updateGroup(groupIndex, (current) => ({
                                  ...current,
                                  status: checked ? 1 : 0,
                                }))
                              }
                              disabled={saving}
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between border border-[#f0dfd1] bg-[#fbf3ed] px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6d5d52]">
                            Choices ({visibleOptions.length})
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-7 rounded-none px-2 text-[11px] uppercase tracking-[0.06em] text-[#c76729] hover:bg-[#fff2e9]"
                            onClick={() => toggleGroupCollapse(groupKey)}
                          >
                            {groupCollapsed ? (
                              <>
                                Show Items
                                <RiArrowDownSLine className="size-4" />
                              </>
                            ) : (
                              <>
                                Hide Items
                                <RiArrowUpSLine className="size-4" />
                              </>
                            )}
                          </Button>
                        </div>

                        {!groupCollapsed && (
                          <div className="border-x border-b border-[#f0dfd1]">
                            <Table>
                              <TableHeader className="bg-[#fbf3ed] text-[#6b5b50]">
                                <TableRow>
                                  <TableHead>Choice Name</TableHead>
                                  <TableHead className="w-34">Extra Price</TableHead>
                                  <TableHead className="w-30">Status</TableHead>
                                  <TableHead className="w-16 text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {visibleOptions.map((option) => {
                                  const optionIndex = group.options.findIndex((candidate) => candidate === option);
                                  return (
                                    <TableRow key={`${option.option_id ?? "new"}-${optionIndex}`} className="border-b border-[#f5e8de]">
                                      <TableCell>
                                        <Input
                                          className="h-8 border-[#e7c8ad] text-sm"
                                          placeholder="Choice name"
                                          value={option.name}
                                          onChange={(event) =>
                                            updateOption(groupIndex, optionIndex, (current) => ({
                                              ...current,
                                              name: event.target.value,
                                            }))
                                          }
                                          disabled={saving}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          className="h-8 border-[#e7c8ad] text-sm"
                                          type="number"
                                          step="0.01"
                                          value={String(option.price_delta)}
                                          onChange={(event) =>
                                            updateOption(groupIndex, optionIndex, (current) => ({
                                              ...current,
                                              price_delta: Number(event.target.value),
                                            }))
                                          }
                                          disabled={saving}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-start">
                                          <Switch
                                            checked={(option.status ?? 1) === 1}
                                            onCheckedChange={(checked) =>
                                              updateOption(groupIndex, optionIndex, (current) => ({
                                                ...current,
                                                status: checked ? 1 : 0,
                                              }))
                                            }
                                            disabled={saving}
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          type="button"
                                          size="icon-xs"
                                          variant="outline"
                                          className="rounded-none border-[#efcdb8] text-[#b54b2d] hover:bg-[#fff1ea]"
                                          onClick={() => removeOption(groupIndex, optionIndex)}
                                          disabled={saving}
                                        >
                                          <RiDeleteBinLine className="size-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow>
                                  <TableCell colSpan={4}>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      className="h-7 rounded-none px-0 text-[11px] uppercase tracking-[0.06em] text-[#c76729] hover:bg-transparent hover:text-[#a44d1b]"
                                      onClick={() =>
                                        updateGroup(groupIndex, (current) => ({
                                          ...current,
                                          options: [...current.options, emptyOption()],
                                        }))
                                      }
                                      disabled={saving}
                                    >
                                      + Add New Choice
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="border border-[#efd8c6] bg-[#fcf7f2] p-3">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#a65e29]">Item Image</h3>
                <label
                  htmlFor="item-photo-upload"
                  className="grid min-h-56 cursor-pointer place-items-center border border-dashed border-[#efbe95] bg-[#fff5ec] p-4 text-center"
                >
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt="Item preview" className="h-full max-h-48 w-full object-cover" />
                  ) : (
                    <div className="space-y-2 text-[#c6743a]">
                      <RiImageAddLine className="mx-auto size-8" />
                      <p className="text-xs font-semibold uppercase tracking-[0.07em]">Drop image or click to upload</p>
                      <p className="text-[11px] text-[#b59378]">Square format (1080x1080) recommended</p>
                    </div>
                  )}
                </label>
                <Input
                  id="item-photo-upload"
                  type="file"
                  accept="image/*"
                  className="mt-3 h-10 border-[#e7c8ad] bg-white"
                  onChange={onSelectPhoto}
                  disabled={saving}
                />
                <Input
                  label="Image URL"
                  className="mt-2 h-10 border-[#e7c8ad] bg-white text-sm"
                  placeholder="https://cdn.example.com/images/item-01.jpg"
                  value={form.existing_photo_url ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      existing_photo_url: event.target.value.trim() ? event.target.value : null,
                    }))
                  }
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#ab9685]">
                  Linking a CDN URL will prioritize the remote asset over local uploads.
                </p>
              </section>

              <section className="border border-[#f36c21] bg-[#f36c21] p-3 text-white">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ffd9bf]">Catalog Preview</h3>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-white/30 pb-1">
                    <span className="text-[#ffd9bf]">Visibility</span>
                    <span>{form.status === 1 ? "Public" : "Hidden"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/30 pb-1">
                    <span className="text-[#ffd9bf]">Terminal</span>
                    <span>All Locations</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffd9bf]">Tax Rate</span>
                    <span>8.5% (Standard)</span>
                  </div>
                </div>
              </section>
            </div>

            {formError && (
              <div className="xl:col-span-2 border border-[#f0b8b8] bg-[#fff3f3] px-3 py-2 text-sm text-[#b64545]">
                {formError}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#efd8c6] px-4 py-4">
          <Button type="button" variant="outline" className={outlineButtonClass} onClick={backToList} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" className={accentButtonClass} onClick={() => void onSave()} disabled={saving || detailLoading}>
            {saving ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-5 text-[#3f3025] [&_button]:cursor-pointer [&_input]:cursor-pointer [&_label]:cursor-pointer [&_select]:cursor-pointer [&_textarea]:cursor-pointer">
      {screenMode === "list" ? renderListScreen() : renderEditorScreen()}
    </div>
  );
}
