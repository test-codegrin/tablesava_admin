import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiErrorWarningFill,
  RiInformationLine,
} from "@remixicon/react";
import { parseApiError } from "@/api/apiClient";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category, StatusFlag } from "@/types/admin";
import Loader from "@/pages/Loader";
import {
  createCategoryApi,
  // deleteCategoryApi,
  getCategoriesApi,
  getCategoryByIdApi,
  updateCategoryApi,
} from "@/api/categoryApi";
// import {
//   filterCategoriesLocally,
//   paginateCategories,
// } from "@/services/categoryService";
import { useNavigate } from "react-router-dom";

// const PAGE_SIZE = 8;

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

// const statusLabel = (status: StatusFlag) => (status === 1 ? "Active" : "Inactive");

const toDateKey = (value?: string) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatActivityTimestamp = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// ─── Status Toggle ────────────────────────────────────────────────────────────
type StatusToggleProps = {
  value: StatusFlag;
  onChange: (next: StatusFlag) => void;
};

function StatusToggle({ value, onChange }: StatusToggleProps) {
  const isActive = value === 1;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.06em]">
        Category Status
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(isActive ? 0 : 1)}
          className="focus:outline-none"
        >
          <span
            className="relative flex items-center overflow-hidden border"
            style={{
              borderColor: "#FB923C",
              background: "#fff",
              width: 44,
              height: 28,
            }}
          >
            <span
              className="absolute transition-all duration-300 ease-in-out"
              style={{
                left: isActive ? 4 : "calc(100% - 24px)",
                top: 4,
                width: 20,
                height: 20,
                background: "#EA580C",
              }}
            />
          </span>
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em]">
          <span
            className="transition-colors duration-200"
            style={{ color: isActive ? "#EA580C" : "#71717A" }}
          >
            Active
          </span>
          <span className="text-zinc-300">/</span>
          <span
            className="transition-colors duration-200"
            style={{ color: !isActive ? "#EA580C" : "#71717A" }}
          >
            Inactive
          </span>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // true while we're fetching the category to pre-fill (from ?editId=)
  const [prefilling, setPrefilling] = useState(false);
  // const [search, setSearch] = useState("");
  // const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  // const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  // ── On mount: check for ?editId= in the URL and pre-fill the form ──────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("editId");

    if (editId) {
      const numericId = Number(editId);
      if (!Number.isNaN(numericId) && numericId > 0) {
        setPrefilling(true);
        getCategoryByIdApi(numericId)
          .then((category) => {
            // getCategoryById may return the category directly or wrapped — adapt as needed
            const cat = (category as { category?: Category }).category ?? (category as Category);
            setEditing(cat);
            setForm({
              name: cat.name,
              description: cat.description,
              status: cat.status,
            });
            setFormError(null);
          })
          .catch((error) => {
            toast.error("Failed to load category for editing", {
              description: parseApiError(error).message,
            });
          })
          .finally(() => {
            setPrefilling(false);
          });
      }
    }
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategoriesApi();
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

  // const filtered = useMemo(
  //   () => filterCategoriesLocally(categories, search, statusFilter),
  //   [categories, search, statusFilter],
  // );

  // const paginated = useMemo(
  //   () => paginateCategories(filtered, page, PAGE_SIZE),
  //   [filtered, page],
  // );
  // const totalPages = Math.max(1, Math.ceil(paginated.total / PAGE_SIZE));

  // useEffect(() => {
  //   if (page > totalPages) setPage(totalPages);
  // }, [page, totalPages]);

  const openCreateForm = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError(null);
    // Remove ?editId= from the URL without a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete("editId");
    window.history.replaceState({}, "", url.toString());
  };

  // const openEditForm = (category: Category) => {
  //   setEditing(category);
  //   setForm({
  //     name: category.name,
  //     description: category.description,
  //     status: category.status,
  //   });
  //   setFormError(null);
  //   // Keep the URL in sync
  //   const url = new URL(window.location.href);
  //   url.searchParams.set("editId", String(category.categories_id));
  //   window.history.replaceState({}, "", url.toString());
  // };

  const validateForm = () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) throw new Error("Category name is required.");
    if (trimmedName.length < 3)
      throw new Error("Category name must be at least 3 characters.");
    if (!(form.status === 0 || form.status === 1))
      throw new Error("Category status must be 0 or 1.");
  };

  const showSystemToast = (description: string) => {
    toast.success("SYSTEM NOTIFICATION", { description });
  };
  
  const navigate = useNavigate();

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

    navigate("/dish-management");

    setSaving(true);
    try {
      if (editing) {
        await updateCategoryApi(editing.categories_id, form);
      } else {
        await createCategoryApi(form);
      }
      showSystemToast(
        editing ? "Category updated successfully" : "Category created successfully",
      );
      openCreateForm();
      await loadCategories();
    } catch (error) {
      toast.error("Category save failed", {
        description: parseApiError(error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  // const onDelete = async (categoryId: number) => {
  //   if (!window.confirm("Delete this category?")) return;
  //   try {
  //     await deleteCategoryApi(categoryId);
  //     showSystemToast("Category deleted successfully");
  //     await loadCategories();
  //   } catch (error) {
  //     toast.error("Delete failed", {
  //       description: parseApiError(error).message,
  //     });
  //   }
  // };

  const nameHint =
    form.name.trim().length > 0 && form.name.trim().length < 3
      ? "Category name must be at least 3 characters."
      : null;

  const inlineError = formError ?? nameHint;
  const editorId = editing
    ? `CAT_${String(editing.categories_id).padStart(3, "0")}`
    : "CAT_001";

  const recentActivity = useMemo(() => {
    return [...categories]
      .sort((left, right) => {
        const leftTime = toDateKey(left.updated_at) || toDateKey(left.created_at);
        const rightTime =
          toDateKey(right.updated_at) || toDateKey(right.created_at);
        return (
          rightTime - leftTime || right.categories_id - left.categories_id
        );
      })
      .slice(0, 4)
      .map((category) => {
        const changedAt = category.updated_at || category.created_at;
        const changedAction =
          category.updated_at && category.updated_at !== category.created_at
            ? "Modified"
            : "Added";
        return {
          id: category.categories_id,
          action: `${changedAction} '${category.name}'`,
          at: formatActivityTimestamp(changedAt),
        };
      });
  }, [categories]);

  return (
    <div className="space-y-6 text-[#3a3b3f]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Inventory <span className="mx-1 text-zinc-300">{">"}</span>{" "}
            <span className="text-[#ff6b1a]">Categories</span>
          </p>
          <h1 className="text-xl font-semibold uppercase tracking-[0.08em] text-[#323238]">
            Categories
          </h1>
          <p className="text-sm text-zinc-500">
            Manage your kitchen taxonomy and menu structure.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreateForm}
          className="h-11 rounded-none border border-[#ff6b1a] bg-[#ff6b1a] px-6 text-sm uppercase tracking-[0.07em] text-white shadow-[0_2px_0_0_#9f4510] hover:bg-[#ed5f15]"
        >
          <RiAddLine className="size-4" />
          Add Category
        </Button>
      </div>

      {/* Form + Sidebar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="border border-[#efcfb2] bg-[#f7f4f2] p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#ebd8c7] pb-4">
            <h2 className="text-base uppercase tracking-[0.06em] text-[#34333a]">
              {editing ? "Edit Category" : "Add Category"}
            </h2>
            <p className="text-xs font-semibold tracking-[0.07em] text-zinc-400">
              MOD_ID: {editorId}
            </p>
          </div>

          {/* Pre-fill loader overlay */}
          {prefilling ? (
            <Loader message="Loading category data..." className="min-h-45" />
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="category-name"
                  className="text-sm font-semibold uppercase tracking-[0.06em]"
                >
                  Category Name *
                </label>
                <input
                  id="category-name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, name: event.target.value }));
                    setFormError(null);
                  }}
                  placeholder="Sea"
                  className="h-11 w-full border border-[#e6bb95] bg-white px-3 text-[15px] outline-none transition focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a]/40"
                />
                {inlineError && (
                  <p className="flex items-center gap-1.5 text-sm text-[#c93333]">
                    <RiErrorWarningFill className="size-4 shrink-0" />
                    {inlineError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="category-description"
                  className="text-sm font-semibold uppercase tracking-[0.06em]"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Brief summary of items in this category..."
                  className="min-h-28 w-full border border-[#e6bb95] bg-white px-3 py-2.5 text-[15px] outline-none transition focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a]/40"
                />
              </div>

              <div className="space-y-2">
                <StatusToggle
                  value={form.status}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, status: next }))
                  }
                />
              </div>

              <div className="border-t border-[#ebd8c7] pt-5">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving || Boolean(nameHint)}
                    className="h-11 rounded-none cursor-pointer border border-[#ff6b1a] bg-[#ff6b1a] px-8 text-sm uppercase tracking-[0.06em] text-white shadow-[0_2px_0_0_#9f4510] hover:bg-[#ed5f15]"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Update Category"
                        : "Save Category"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/dish-management`;
                    }}
                    disabled={saving}
                    className="h-11 rounded-none cursor-pointer border-[#e6bb95] px-8 text-sm uppercase tracking-[0.06em] text-zinc-600 hover:bg-[#f3ece6]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="border border-[#efcfb2] bg-[#f2ebe3] p-5">
            <div className="mb-3 flex items-center gap-2 text-[#b0430f]">
              <RiInformationLine className="size-4" />
              <h3 className="text-base uppercase tracking-[0.06em]">Guidance</h3>
            </div>
            <ul className="space-y-2.5 pl-4 text-[15px] leading-6 text-[#5a5048]">
              <li className="list-disc marker:text-[#ff6b1a]">
                Categories help organize kitchen displays and reporting modules.
              </li>
              <li className="list-disc marker:text-[#ff6b1a]">
                Active categories will appear immediately on all POS terminals.
              </li>
              <li className="list-disc marker:text-[#ff6b1a]">
                Use clear, industry-standard naming conventions for better menu
                engineering.
              </li>
            </ul>
          </section>

          <section className="border border-[#12151d] bg-[#10131c] p-5 text-zinc-200">
            <h3 className="mb-3 text-base uppercase tracking-[0.06em] text-[#ff8a3d]">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No category activity yet.
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-l-2 border-[#ff6b1a]/70 pl-3"
                  >
                    <p className="text-xs text-zinc-400">{activity.at}</p>
                    <p className="text-sm">{activity.action}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Filter bar */}
      {/* <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3 border border-[#efcfb2] bg-white p-4">
          <div className="min-w-60 flex-1 space-y-1">
            <label
              htmlFor="category-search"
              className="text-sm font-semibold text-zinc-700"
            >
              Search
            </label>
            <input
              id="category-search"
              className="h-11 w-full border border-[#e6bb95] bg-white px-3 text-sm outline-none transition focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a]/40"
              placeholder="Search by name or description"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="min-w-48 space-y-1">
            <label
              htmlFor="statusFilter"
              className="text-sm font-semibold text-zinc-700"
            >
              Status Filter
            </label>
            <select
              id="statusFilter"
              className="h-11 w-full border border-[#e6bb95] bg-white px-3 text-sm outline-none transition focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a]/40"
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

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCategories()}
            disabled={loading}
            className="h-11 rounded-none border-[#e6bb95] px-6 text-sm uppercase tracking-[0.06em] hover:bg-[#f3ece6]"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="border border-[#efcfb2] bg-white p-2">
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
                  <TableCell colSpan={5}>
                    <Loader
                      message="Loading categories..."
                      className="min-h-[80px]"
                    />
                  </TableCell>
                </TableRow>
              ) : paginated.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-zinc-500"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.items.map((category) => (
                  <TableRow key={category.categories_id}>
                    <TableCell>{category.categories_id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell className="max-w-[260px] truncate">
                      {category.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.status === 1 ? "default" : "secondary"
                        }
                        className="rounded-none"
                      >
                        {statusLabel(category.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none border-[#f1c8a8] px-2.5 text-[#d15a15] hover:bg-[#fff1e5]"
                          onClick={() => openEditForm(category)}
                        >
                          <RiEdit2Line className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none border-[#f1c8a8] px-2.5 text-[#b8472f] hover:bg-[#fff1e5]"
                          onClick={() =>
                            void onDelete(category.categories_id)
                          }
                        >
                          <RiDeleteBinLine className="size-4" />
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
            className="rounded-none border-[#e6bb95] hover:bg-[#f3ece6]"
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
            className="rounded-none border-[#e6bb95] hover:bg-[#f3ece6]"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      </div> */}
    </div>
  );
}