import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiAddLine, RiSearchLine } from "@remixicon/react";

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
import { Textarea } from "@/components/ui/textarea";
import { getCategories } from "@/services/categoryService";
import Loader from "@/pages/Loader";
import {
  createItem,
  deleteItem,
  filterItemsLocally,
  getCategoryItems,
  getItems,
  patchItemStatus,
  updateItem,
} from "@/services/itemService";
import type {
  Category,
  Item,
  ItemOption,
  ItemOptionGroup,
  StatusFlag,
} from "@/types/admin";

const PAGE_SIZE = 8;

type ItemForm = {
  categories_id: number;
  name: string;
  description: string;
  price: string;
  status: StatusFlag;
  photo: File | null;
  existing_photo_url: string | null;
  option_groups: ItemOptionGroup[];
};

const emptyOption = (): ItemOption => ({
  name: "",
  price_delta: 0,
});

const emptyOptionGroup = (): ItemOptionGroup => ({
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

const toFormFromItem = (item: Item): ItemForm => ({
  categories_id: item.categories_id,
  name: item.name,
  description: item.description,
  price: String(item.price),
  status: item.status,
  photo: null,
  existing_photo_url: item.photo_url ?? null,
  option_groups: item.option_groups?.length
    ? item.option_groups.map((group) => ({
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
          is_deleted: false,
        })),
      }))
    : [emptyOptionGroup()],
});

const statusLabel = (status: StatusFlag) =>
  status === 1 ? "Active" : "Inactive";

const statusBadgeClass = (status?: StatusFlag) =>
  status === 1
    ? "border border-[#16A34A] text-[#15803D] text-[12px]"
    : "border border-[#E0C0B1] text-[#94A3B8] text-[12px]";

export default function Inventory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [form, setForm] = useState<ItemForm>(createInitialForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | number>("all");
  const [page, setPage] = useState(1);
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = useState<
    string | null
  >(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesResponse, itemsResponse] = await Promise.all([
        getCategories(),
        getItems(),
      ]);
      setCategories(categoriesResponse.categories);
      setItems(itemsResponse.items);
    } catch (error) {
      toast.error("Failed to load inventory", {
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

  const filteredByStatusAndSearch = useMemo(
    () => filterItemsLocally(items, search, statusFilter),
    [items, search, statusFilter],
  );

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? filteredByStatusAndSearch
        : filteredByStatusAndSearch.filter(
            (item) => item.categories_id === categoryFilter,
          ),
    [categoryFilter, filteredByStatusAndSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const getCategoryName = (categories_id: number) =>
    categories.find((category) => category.categories_id === categories_id)
      ?.name || "-";

  const openCreateDialog = () => {
    setEditing(null);
    setForm(createInitialForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (item: Item) => {
    setEditing(item);
    setForm(toFormFromItem(item));
    setFormError(null);
    setDialogOpen(true);

    try {
      const categoryItemsResponse = await getCategoryItems(item.categories_id);
      const detailed = categoryItemsResponse.items.find(
        (entry) => entry.item_id === item.item_id,
      );
      if (detailed) {
        setForm((prev) => ({
          ...prev,
          existing_photo_url: detailed.photo_url ?? prev.existing_photo_url,
          option_groups: toFormFromItem(detailed).option_groups,
        }));
      }
    } catch (error) {
      toast.error("Could not load detailed option groups", {
        description: parseApiError(error).message,
      });
    }
  };

  const updateGroup = (
    groupIndex: number,
    updater: (group: ItemOptionGroup) => ItemOptionGroup,
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
    updater: (option: ItemOption) => ItemOption,
  ) => {
    updateGroup(groupIndex, (group) => ({
      ...group,
      options: group.options.map((option, index) =>
        index === optionIndex ? updater(option) : option,
      ),
    }));
  };

  const removeOptionGroup = (groupIndex: number) => {
    setForm((prev) => {
      const current = prev.option_groups[groupIndex];
      if (!current) {
        return prev;
      }

      if (typeof current.group_id === "number") {
        return {
          ...prev,
          option_groups: prev.option_groups.map((group, index) =>
            index === groupIndex ? { ...group, is_deleted: true } : group,
          ),
        };
      }

      return {
        ...prev,
        option_groups: prev.option_groups.filter(
          (_, index) => index !== groupIndex,
        ),
      };
    });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    updateGroup(groupIndex, (group) => {
      const targetOption = group.options[optionIndex];
      if (!targetOption) {
        return group;
      }

      if (typeof targetOption.option_id === "number") {
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
    if (!(form.status === 0 || form.status === 1)) {
      throw new Error("Item status must be 0 or 1.");
    }
    if (form.option_groups.length === 0) {
      throw new Error("At least one option group is required.");
    }
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
      setDialogOpen(false);
      await refreshItems();
    } catch (error) {
      toast.error("Item save failed", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!form.photo) {
      setSelectedPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.photo);
    setSelectedPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form.photo]);

  const onDelete = async (itemId: number) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    try {
      const response = await deleteItem(itemId);
      toast.success("Item deleted", { description: response.message });
      await refreshItems();
    } catch (error) {
      toast.error("Delete failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const onToggleStatus = async (item: Item) => {
    try {
      const nextStatus: StatusFlag = item.status === 1 ? 0 : 1;
      const response = await patchItemStatus(item.item_id, nextStatus);
      toast.success("Item status updated", { description: response.message });
      await refreshItems();
    } catch (error) {
      toast.error("Status update failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const openPreviewDialog = async (item: Item) => {
    setPreviewItem(item);
    setPreviewLoading(true);
    try {
      const response = await getCategoryItems(item.categories_id);
      const detailed = response.items.find(
        (entry) => entry.item_id === item.item_id,
      );
      if (detailed) {
        setPreviewItem((current) =>
          current?.item_id === item.item_id ? detailed : current,
        );
      }
    } catch (error) {
      toast.error("Could not load item preview details", {
        description: parseApiError(error).message,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const accentButtonClass =
    "h-10 rounded-none border border-[#f36c21] bg-[#f36c21] px-4 text-xs uppercase tracking-[0.07em] text-white hover:bg-[#df5d15]";
  const outlineButtonClass =
    "h-10 rounded-none border border-[#eac8aa] bg-white px-4 text-xs uppercase tracking-[0.07em] text-[#735f4f] hover:bg-[#f8eee4]";

  return (
    <div className="space-y-4 p-6 bg-[#fff8f6]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-medium tracking-wide text-zinc-900">
          Inventory / Items
        </h1>
        <Button
          type="button"
          onClick={openCreateDialog}
          className={accentButtonClass}
        >
          <RiAddLine className="size-4" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px_250px_auto] gap-3 border border-[#e0c0b1] bg-white p-4 md:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inventory-quick-search">Quick Search</Label>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 size-4" />
            <Input
              id="inventory-quick-search"
              className="h-11 border-[#e7c8ad] bg-white pl-9 text-sm tracking-[0.04em]"
              placeholder="Search by name or description"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inventory-category-filter">Category Filter</Label>
          <select
            id="inventory-category-filter"
            className="h-11 border border-[#e0c0b1] bg-zinc-50 px-3 text-sm"
            value={String(categoryFilter)}
            onChange={(event) => {
              const nextValue = event.target.value;
              setCategoryFilter(
                nextValue === "all" ? "all" : Number(nextValue),
              );
              setPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option
                key={category.categories_id}
                value={category.categories_id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inventory-status-filter">Status Filter</Label>
          <select
            id="inventory-status-filter"
            className="h-11 border border-[#e0c0b1] bg-zinc-50 px-3 text-sm"
            value={String(statusFilter)}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(
                value === "all" ? "all" : Number(value) === 1 ? 1 : 0,
              );
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            className="h-11 border border-[#e0c0b1] bg-zinc-50 px-3 text-sm"
            variant="outline"
            onClick={() => {
              void loadData();
            }}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="border border-[#e0c0b1] bg-white">
        <Table>
          <TableHeader className="bg-[#f8efe7] text-[#5b4e45] font-bold uppercase">
            <TableRow>
              <TableHead className="text-[#7c2d12]">ID</TableHead>
              <TableHead className="text-[#7c2d12]">Category</TableHead>
              <TableHead className="text-[#7c2d12]">Name</TableHead>
              <TableHead className="text-[#7c2d12]">Img</TableHead>
              <TableHead className="text-[#7c2d12]">Price</TableHead>
              <TableHead className="text-[#7c2d12]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Loader message="Loading items..." className="min-h-[80px]" />
                </TableCell>
              </TableRow>
            ) : paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.item_id}>
                  <TableCell>{item.item_id}</TableCell>
                  <TableCell>{getCategoryName(item.categories_id)}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-10 w-10 rounded border border-[#e0c0b1] object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">No photo</span>
                    )}
                  </TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-none px-2 py-0.5 text-[10px]  ${statusBadgeClass(item.status)}`}
                    >
                      {statusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void openPreviewDialog(item);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          void openEditDialog(item);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void onToggleStatus(item);
                        }}
                      >
                        {item.status === 1 ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          void onDelete(item.item_id);
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
          Showing {paginatedItems.length} of {filtered.length}
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
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Create Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-category">Category</Label>
                <select
                  id="item-category"
                  className="h-11 border border-[#e0c0b1] bg-zinc-50 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.categories_id || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      categories_id: Number(event.target.value),
                    }))
                  }
                  disabled={saving || Boolean(editing)}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={category.categories_id}
                      value={category.categories_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Item Name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                disabled={saving}
              />
              <Input
                label="Price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, price: event.target.value }))
                }
                disabled={saving}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-status">Status</Label>
                <select
                  id="item-status"
                  className="h-11 border border-[#e0c0b1] bg-zinc-50 px-3 text-sm"
                  value={String(form.status)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: Number(event.target.value) === 1 ? 1 : 0,
                    }))
                  }
                  disabled={saving}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-photo">Photo (image, max 5MB)</Label>
              <input
                id="item-photo"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    photo: event.target.files?.[0] || null,
                  }))
                }
                disabled={saving}
                className="h-11 w-full border border-black bg-zinc-50 p-2 text-sm"
              />
              {(selectedPhotoPreviewUrl || form.existing_photo_url) && (
                <div className="pt-2">
                  <img
                    src={
                      selectedPhotoPreviewUrl || form.existing_photo_url || ""
                    }
                    alt="Item preview"
                    className="h-24 w-24 rounded border border-zinc-200 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 border border-zinc-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-800">Option Groups</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      option_groups: [
                        ...prev.option_groups,
                        emptyOptionGroup(),
                      ],
                    }))
                  }
                  disabled={saving}
                >
                  Add Group
                </Button>
              </div>

              {form.option_groups.map((group, groupIndex) => (
                <div
                  key={`${group.group_id ?? "new"}-${groupIndex}`}
                  className={`space-y-2 border p-3 ${group.is_deleted ? "opacity-60" : ""}`}
                >
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <Input
                      label="Group Name"
                      value={group.name}
                      onChange={(event) =>
                        updateGroup(groupIndex, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      disabled={saving || group.is_deleted}
                    />
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`group-multiple-${groupIndex}`}>
                        Multiple Select
                      </Label>
                      <select
                        id={`group-multiple-${groupIndex}`}
                        className="h-11 border border-black bg-zinc-50 px-3 text-sm"
                        value={String(group.multiple_select)}
                        onChange={(event) =>
                          updateGroup(groupIndex, (current) => ({
                            ...current,
                            multiple_select:
                              Number(event.target.value) === 1 ? 1 : 0,
                          }))
                        }
                        disabled={saving || group.is_deleted}
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex w-full flex-col gap-1.5">
                        <Label htmlFor={`group-required-${groupIndex}`}>
                          Is Required
                        </Label>
                        <select
                          id={`group-required-${groupIndex}`}
                          className="h-11 border border-black bg-zinc-50 px-3 text-sm"
                          value={String(group.is_required)}
                          onChange={(event) =>
                            updateGroup(groupIndex, (current) => ({
                              ...current,
                              is_required:
                                Number(event.target.value) === 1 ? 1 : 0,
                            }))
                          }
                          disabled={saving || group.is_deleted}
                        >
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </select>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeOptionGroup(groupIndex)}
                        disabled={saving}
                      >
                        {group.group_id ? "Mark Delete" : "Remove"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-zinc-200 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-700">
                        Options
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateGroup(groupIndex, (current) => ({
                            ...current,
                            options: [...current.options, emptyOption()],
                          }))
                        }
                        disabled={saving || group.is_deleted}
                      >
                        Add Option
                      </Button>
                    </div>
                    {group.options.map((option, optionIndex) => (
                      <div
                        key={`${option.option_id ?? "new"}-${optionIndex}`}
                        className={`grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_120px] ${
                          option.is_deleted ? "opacity-60" : ""
                        }`}
                      >
                        <Input
                          label="Option Name"
                          value={option.name}
                          onChange={(event) =>
                            updateOption(
                              groupIndex,
                              optionIndex,
                              (current) => ({
                                ...current,
                                name: event.target.value,
                              }),
                            )
                          }
                          disabled={
                            saving || group.is_deleted || option.is_deleted
                          }
                        />
                        <Input
                          label="Price Delta"
                          type="number"
                          step="0.01"
                          value={option.price_delta}
                          onChange={(event) =>
                            updateOption(
                              groupIndex,
                              optionIndex,
                              (current) => ({
                                ...current,
                                price_delta: Number(event.target.value),
                              }),
                            )
                          }
                          disabled={
                            saving || group.is_deleted || option.is_deleted
                          }
                        />
                        <div className="flex items-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              removeOption(groupIndex, optionIndex)
                            }
                            disabled={saving || group.is_deleted}
                          >
                            {option.option_id ? "Mark Delete" : "Remove"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            <Button
              type="button"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "Saving..." : editing ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewItem) || previewLoading}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
            setPreviewLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Item Preview</DialogTitle>
          </DialogHeader>
          {previewLoading && (
            <Loader
              message="Loading item details..."
              className="min-h-[80px]"
            />
          )}
          {previewItem && (
            <div className="space-y-3 text-sm text-zinc-700">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <p>
                  <strong>ID:</strong> {previewItem.item_id}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {getCategoryName(previewItem.categories_id)}
                </p>
                <p>
                  <strong>Name:</strong> {previewItem.name}
                </p>
                <p>
                  <strong>Price:</strong> {previewItem.price}
                </p>
                <p>
                  <strong>Status:</strong> {statusLabel(previewItem.status)}
                </p>
              </div>

              {previewItem.photo_url && (
                <div>
                  <p className="mb-1">
                    <strong>Photo:</strong>
                  </p>
                  <img
                    src={previewItem.photo_url}
                    alt={previewItem.name}
                    className="h-28 w-28 rounded border border-zinc-200 object-cover"
                  />
                </div>
              )}

              <div>
                <p className="mb-1">
                  <strong>Description:</strong>
                </p>
                <p className="rounded border border-zinc-200 bg-zinc-50 p-2">
                  {previewItem.description || "-"}
                </p>
              </div>

              <div>
                <p className="mb-2">
                  <strong>Option Groups:</strong>
                </p>
                {!previewItem.option_groups ||
                previewItem.option_groups.length === 0 ? (
                  <p className="text-zinc-500">No option groups.</p>
                ) : (
                  <div className="space-y-2">
                    {previewItem.option_groups.map((group, index) => (
                      <div
                        key={`${group.group_id ?? "g"}-${index}`}
                        className="rounded border border-zinc-200 p-2"
                      >
                        <p className="font-medium">{group.name}</p>
                        <p className="text-xs text-zinc-500">
                          Multiple Select: {group.multiple_select} | Is
                          Required: {group.is_required}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {group.options.map((option, optIndex) => (
                            <span
                              key={`${option.option_id ?? "o"}-${optIndex}`}
                              className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs"
                            >
                              {option.name} ({option.price_delta})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewItem(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
