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
import { Textarea } from "@/components/ui/textarea";
import type { Category, StatusFlag } from "@/types/admin";
import {
  createCategory,
  deleteCategory,
  filterCategoriesLocally,
  getCategories,
  paginateCategories,
  updateCategory,
} from "@/services/categoryService";

const PAGE_SIZE = 8;

type CategoryForm = {
  name: string;
  description: string;
  status: StatusFlag;
};

const initialForm: CategoryForm = {
  name: "",
  description: "",
  status: 1,
};

const statusLabel = (status: StatusFlag) => (status === 1 ? "Active" : "Inactive");

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      setCategories(response.categories);
    } catch (error) {
      toast.error("Failed to fetch categories", {
        description: parseApiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const filtered = useMemo(
    () => filterCategoriesLocally(categories, search, statusFilter),
    [categories, search, statusFilter],
  );

  const paginated = useMemo(() => paginateCategories(filtered, page, PAGE_SIZE), [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(paginated.total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openCreateDialog = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      throw new Error("Category name is required.");
    }
    if (!(form.status === 0 || form.status === 1)) {
      throw new Error("Category status must be 0 or 1.");
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
      const response = editing
        ? await updateCategory(editing.categories_id, form)
        : await createCategory(form);

      toast.success(editing ? "Category updated" : "Category created", {
        description: response.message,
      });
      setDialogOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error("Category save failed", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (categoryId: number) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      const response = await deleteCategory(categoryId);
      toast.success("Category deleted", { description: response.message });
      await loadCategories();
    } catch (error) {
      toast.error("Delete failed", {
        description: parseApiError(error).message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-zinc-900">Category Management</h1>
        <Button type="button" onClick={openCreateDialog}>
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <Input
          label="Search"
          placeholder="Search by name or description"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statusFilter">Status Filter</Label>
          <select
            id="statusFilter"
            className="h-11 border border-black bg-zinc-50 px-3 text-sm"
            value={String(statusFilter)}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(value === "all" ? "all" : Number(value) === 1 ? 1 : 0);
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
            variant="outline"
            onClick={() => {
              void loadCategories();
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
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : paginated.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.items.map((category) => (
                <TableRow key={category.categories_id}>
                  <TableCell>{category.categories_id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{category.description}</TableCell>
                  <TableCell>
                    <Badge variant={category.status === 1 ? "default" : "secondary"}>
                      {statusLabel(category.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditDialog(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          void onDelete(category.categories_id);
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
          Showing {paginated.items.length} of {paginated.total}
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
            <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-status">Status</Label>
              <select
                id="category-status"
                className="h-11 w-full border border-black bg-zinc-50 px-3 text-sm"
                value={String(form.status)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: Number(event.target.value) === 1 ? 1 : 0 }))
                }
              >
                <option value="1">Active (1)</option>
                <option value="0">Inactive (0)</option>
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
              {saving ? "Saving..." : editing ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

