import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RiAddLine, RiDeleteBinLine, RiEdit2Line } from "@remixicon/react";
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
import { deleteCategoryApi, getCategoriesApi } from "@/api/categoryApi";
import {
  filterCategoriesLocally,
  paginateCategories,
} from "@/services/categoryService";

const PAGE_SIZE = 8;

const statusLabel = (status: StatusFlag) =>
  status === 1 ? "Active" : "Inactive";

export default function DishManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFlag>("all");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(
    () => filterCategoriesLocally(categories, search, statusFilter),
    [categories, search, statusFilter],
  );

  const paginated = useMemo(
    () => paginateCategories(filtered, page, PAGE_SIZE),
    [filtered, page],
  );
  const totalPages = Math.max(1, Math.ceil(paginated.total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const onDelete = async (categoryId: number) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategoryApi(categoryId);
      toast.success("SYSTEM NOTIFICATION", {
        description: "Category deleted successfully",
      });
      await loadCategories();
    } catch (error) {
      toast.error("Delete failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const handleEdit = (categoryId: number) => {
    window.location.href = `/category?editId=${categoryId}`;
  };

  const handleAddNew = () => {
    window.location.href = `/category`;
  };

  return (
    <div className="dish-management-page space-y-6 text-[#3a3b3f] bg-[#fff8f6] p-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Inventory <span className="mx-1 text-zinc-300">{">"}</span>{" "}
            <span className="text-[#ff6b1a]">Categories</span>
          </p>
        </div>
      </div>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-medium uppercase tracking-[0.08em] text-[#323238]">
            Categories
          </h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-[0.2em] mt-1">
            Master menu classification system
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddNew}
          className="h-11 rounded-none border border-[#ff6b1a] bg-[#f97316] px-6 text-sm font-light tracking-[0.07em] text-white shadow-[0_2px_0_0_#9f4510] hover:bg-[#ed5f15] cursor-pointer"
        >
          <RiAddLine className="size-4" />
          Add Category
        </Button>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 border border-[#efcfb2] bg-[#fffdfb] p-3">
          {/* Search */}
          <div className="relative min-w-[320px] flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#b8aca0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              id="category-search"
              placeholder="SEARCH CATEGORIES..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full border border-[#efcfb2] bg-white pl-12 pr-4 text-[14px] uppercase tracking-[0.06em] text-[#5b5147] outline-none placeholder:text-[#c2b8ae] focus:border-[#ff6b1a]"
            />
          </div>

          {/* Filter Label */}
          <p className="text-xs uppercase tracking-[0.08em] text-[#b3a79a]">
            Filter By Status
          </p>

          {/* Select */}
          <div className="min-w-[180px]">
            <select
              id="statusFilter"
              value={String(statusFilter)}
              onChange={(event) => {
                const value = event.target.value;

                setStatusFilter(
                  value === "all" ? "all" : Number(value) === 1 ? 1 : 0,
                );

                setPage(1);
              }}
              className="h-11 w-full border border-[#efcfb2] bg-white px-4 text-[14px] uppercase tracking-[0.06em] text-[#5b5147] outline-none cursor-pointer focus:border-[#ff6b1a]"
            >
              <option value="all">ALL STATUSES</option>
              <option value="1">ACTIVE</option>
              <option value="0">INACTIVE</option>

            </select>
          </div>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCategories()}
            disabled={loading}
            className="h-11 rounded-none border-[#e6bb95] px-6 text-sm uppercase tracking-[0.06em] hover:bg-[#f3ece6] cursor-pointer"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Table */}
        <div className="border border-[#feddbc] bg-white">
          <Table>
            <TableHeader className="bg-[#fff7ed] font-bold">
              <TableRow>
                <TableHead className="text-[#7c2d12]">ID</TableHead>
                <TableHead className="text-[#7c2d12]">Name</TableHead>
                <TableHead className="text-[#7c2d12]">Status</TableHead>
                <TableHead className="text-[#7c2d12]">Item Count</TableHead>
                <TableHead className="text-[#7c2d12]">Created Date</TableHead>
                <TableHead className="text-[#7c2d12] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Loader
                      message="Loading categories..."
                      className="min-h-20"
                    />
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
                            ? "border border-[#EA580C] text-[#EA580C] uppercase text-[12px]"
                            : "border-[#D4D4D8] text-[#A1A1AA] uppercase text-[12px]"
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
                          className="rounded-none border-[#f1c8a8] px-2.5 text-[#d15a15] hover:bg-[#fff1e5] cursor-pointer"
                          onClick={() => handleEdit(category.categories_id)}
                        >
                          <RiEdit2Line className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none border-[#f1c8a8] px-2.5 text-[#b8472f] hover:bg-[#fff1e5] cursor-pointer"
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
            className="rounded-none border-[#e6bb95] hover:bg-[#f3ece6] cursor-pointer"
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
            className="rounded-none border-[#e6bb95] hover:bg-[#f3ece6] cursor-pointer"
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
