import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RiDeleteBinLine,
  RiEdit2Line,
} from "@remixicon/react";
import { parseApiError } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category, StatusFlag } from "@/types/admin";
import Loader from "@/pages/Loader";
import {
  deleteCategory,
  filterCategoriesLocally,
  getCategories,
  paginateCategories,
} from "@/services/categoryService";

const PAGE_SIZE = 8;

const statusLabel = (status: StatusFlag) => (status === 1 ? "Active" : "Inactive");

export default function CategoryTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  const [page, setPage] = useState(1);

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
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const showSystemToast = (description: string) => {
    toast.success("SYSTEM NOTIFICATION", { description });
  };

  const onDelete = async (categoryId: number) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory(categoryId);
      showSystemToast("Category deleted successfully");
      await loadCategories();
    } catch (error) {
      toast.error("Delete failed", { description: parseApiError(error).message });
    }
  };

  return (
    <div className="category-table-page space-y-6 text-[#3a3b3f]">
      {/* Breadcrumb */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
          Inventory <span className="mx-1 text-zinc-300">{">"}</span>{" "}
          <span className="text-[#ff6b1a]">Category List</span>
        </p>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold uppercase tracking-[0.08em] text-[#323238]">
          Category List
        </h1>
        <p className="text-sm text-zinc-500">Browse, filter, and manage all existing categories.</p>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3 border border-[#efcfb2] bg-white p-4">
          <div className="min-w-60 flex-1 space-y-1">
            <label htmlFor="category-search" className="text-sm font-semibold text-zinc-700">
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
            <label htmlFor="statusFilter" className="text-sm font-semibold text-zinc-700">
              Status Filter
            </label>
            <select
              id="statusFilter"
              className="h-11 w-full border border-[#e6bb95] bg-white px-3 text-sm outline-none transition focus:border-[#ff6b1a] focus:ring-1 focus:ring-[#ff6b1a]/40"
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

        {/* Table */}
        <div className="border border-[#efcfb2] bg-white p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Item Count</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Loader message="Loading categories..." className="min-h-20" />
                  </TableCell>
                </TableRow>
              ) : paginated.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.items.map((category) => (
                  <TableRow key={category.categories_id}>
                    <TableCell>{category.categories_id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-none ${
                          category.status === 1
                            ? "border border-[#EA580C] text-[#EA580C]"
                            : "border-[#D4D4D8] text-[#A1A1AA]"
                        }`}
                      >
                        {statusLabel(category.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.item_count}</TableCell>
                    <TableCell>{category.created_at}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none border-[#f1c8a8] px-2.5 text-[#d15a15] hover:bg-[#fff1e5]"
                          onClick={() => {
                            // Navigate to the form page with the category pre-loaded.
                            // If you want inline editing here too, lift state to a shared
                            // context or pass via router state:
                            // navigate("/category", { state: { editing: category } });
                            window.location.href = `/category`;
                          }}
                        >
                          <RiEdit2Line className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none border-[#f1c8a8] px-2.5 text-[#b8472f] hover:bg-[#fff1e5]"
                          onClick={() => void onDelete(category.categories_id)}
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

      {/* Pagination */}
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
      </div>
    </div>
  );
}