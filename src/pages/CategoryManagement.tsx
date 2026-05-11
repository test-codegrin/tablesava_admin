import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiErrorWarningFill,
  RiInformationLine,
} from "@remixicon/react";
import { parseApiError } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import type { Category, StatusFlag } from "@/types/admin";
import Loader from "@/pages/Loader";
import {
  createCategoryApi,
  getCategoriesApi,
  getCategoryByIdApi,
  updateCategoryApi,
} from "@/api/categoryApi";
import { useNavigate } from "react-router-dom";

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

type StatusToggleProps = {
  value: StatusFlag;
  onChange: (next: StatusFlag) => void;
};

function StatusToggle({ value, onChange }: StatusToggleProps) {
  const isActive = value === 1;

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5F554D]">
        Category Status
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(isActive ? 0 : 1)}
          className="focus:outline-none"
        >
          <span
            className="relative flex items-center overflow-hidden border"
            style={{
              borderColor: "#D8B79D",
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
                background: "#E56A1F",
              }}
            />
          </span>
        </button>

        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em]">
          <span
            className="transition-colors duration-200"
            style={{
              color: isActive ? "#E56A1F" : "#9A9188",
            }}
          >
            Active
          </span>

          <span className="text-zinc-300">/</span>

          <span
            className="transition-colors duration-200"
            style={{
              color: !isActive ? "#E56A1F" : "#9A9188",
            }}
          >
            Inactive
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [form, setForm] = useState<CategoryForm>(initialForm);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("editId");

    if (editId) {
      const numericId = Number(editId);

      if (!Number.isNaN(numericId) && numericId > 0) {
        setPrefilling(true);

        getCategoryByIdApi(numericId)
          .then((category) => {
            const cat =
              (category as { category?: Category }).category ??
              (category as Category);

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

  const openCreateForm = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("editId");

    window.history.replaceState({}, "", url.toString());
  };

  const validateForm = () => {
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      throw new Error("Category name is required.");
    }

    if (trimmedName.length < 3) {
      throw new Error("Category name must be at least 3 characters.");
    }

    if (!(form.status === 0 || form.status === 1)) {
      throw new Error("Category status must be 0 or 1.");
    }
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

      toast.error("Validation failed", {
        description: message,
      });

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
        editing
          ? "Category updated successfully"
          : "Category created successfully",
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
        const leftTime =
          toDateKey(left.updated_at) || toDateKey(left.created_at);

        const rightTime =
          toDateKey(right.updated_at) || toDateKey(right.created_at);

        return rightTime - leftTime || right.categories_id - left.categories_id;
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
    <div className="space-y-6 bg-[#fff8f6] text-[#4B4B4B] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[14px] uppercase tracking-[0.12em] text-[#9A8F84] font-medium">
            Inventory <span className="mx-1 text-zinc-300">{">"}</span>
            <span className="font-semibold text-[#E56A1F]">Categories</span>
          </p>

          <h1 className="mt-6 text-[16px] font-medium uppercase tracking-[0.05em] text-[#3B352F]">
            Categories
          </h1>

          <p className="text-[13px] text-[#8A8178] tracking-[0.06em]">
            Manage your kitchen taxonomy and menu structure.
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreateForm}
          className="h-10 rounded-none cursor-pointer border border-[#914312] bg-[#f97316] px-5 text-[14px] font-light uppercase tracking-[0.06em] text-white hover:bg-[#cf5d17]"
        >
          <RiAddLine className="size-4" />
          Add Category
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Form */}
        <section className="border border-[#E8D7C8] bg-white p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#E4D4C7] pb-4">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[#49413A]">
              {editing ? "Edit Category" : "Add Category"}
            </h2>

            <p className="text-[12px] font-medium tracking-[0.08em] text-[#A2978D]">
              MOD_ID: {editorId}
            </p>
          </div>

          {prefilling ? (
            <Loader message="Loading category data..." className="min-h-45" />
          ) : (
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="category-name"
                  className="text-[14px] font-medium uppercase tracking-[0.05em] text-[#5F554D]"
                >
                  Category Name *
                </label>

                <input
                  id="category-name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }));

                    setFormError(null);
                  }}
                  placeholder="Sea"
                  className="h-11 w-full border border-[#DFC7B5] bg-[#FFFDFB] px-3 text-[15px] outline-none transition focus:border-[#E56A1F] focus:ring-1 focus:ring-[#E56A1F]/20 mt-2"
                />

                {inlineError && (
                  <p className="flex items-center gap-1.5 text-sm text-[#D24B43]">
                    <RiErrorWarningFill className="size-4 shrink-0" />
                    {inlineError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="category-description"
                  className="text-[14px] font-medium uppercase tracking-[0.05em] text-[#5F554D]"
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
                  className="min-h-28 w-full border border-[#DFC7B5] bg-[#FFFDFB] px-3 py-2.5 text-[15px] outline-none transition focus:border-[#E56A1F] focus:ring-1 focus:ring-[#E56A1F]/20 mt-2"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <StatusToggle
                  value={form.status}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      status: next,
                    }))
                  }
                />
              </div>

              {/* Buttons */}
              <div className="border-t border-[#E4D4C7] pt-5">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving || Boolean(nameHint)}
                    className="h-10 rounded-none cursor-pointer border border-[#E56A1F] bg-[#f97316] px-7 text-[14px] font-light uppercase tracking-[0.05em] text-white hover:bg-[#cf5d17]"
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
                    className="h-10 rounded-none cursor-pointer border-[#D9C6B8] px-7 text-[14px] font-light uppercase tracking-[0.05em] text-[#6F655D] hover:bg-[#F3ECE6]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Guidance */}
          <section className="border border-[#E4D4C7] bg-[#fff7ed] p-5">
            <div className="mb-3 flex items-center gap-2 text-[#9A3412]">
              <RiInformationLine className="size-4" />

              <h3 className="text-[15px] uppercase tracking-[0.06em]">
                Guidance
              </h3>
            </div>

            <ul className="space-y-2.5 pl-4 text-[15px] leading-6 text-[#726960]">
              <li className="list-disc marker:text-[#E56A1F]">
                Categories help organize kitchen displays and reporting modules.
              </li>

              <li className="list-disc marker:text-[#E56A1F]">
                Active categories will appear immediately on all POS terminals.
              </li>

              <li className="list-disc marker:text-[#E56A1F]">
                Use clear, industry-standard naming conventions for better menu
                engineering.
              </li>
            </ul>
          </section>

          {/* Activity */}
          <section className="border border-[#1D1B1A] bg-[#161514] p-5 text-[#EAE5E0]">
            <h3 className="mb-3 text-[16px] font-light uppercase tracking-[0.06em] text-[#f97316]">
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
                    className="border-l-2 border-[#E56A1F]/70 pl-3"
                  >
                    <p className="text-xs text-zinc-400">{activity.at}</p>

                    <p className="text-[14px]">{activity.action}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
