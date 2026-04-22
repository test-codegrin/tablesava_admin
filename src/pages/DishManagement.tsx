"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Loader from ".././pages/Loader";
import DeleteDialog from "./DeleteDialog";

const API_BASE = "https://1n2nng7m-3000.inc1.devtunnels.ms";

interface CategoryItem {
  categories_id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  item_count?: number;
  created_at?: string;
}

const PAGE_SIZE = 5;

export default function DishManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.data.categories);
    } catch {
      toast.error("Server error", {
        description: "Could not fetch categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", description: "", status: "active" });
    setIsOpen(true);
  };

  const openEdit = (cat: CategoryItem) => {
    setEditingId(cat.categories_id);
    setForm({
      name: cat.name,
      description: cat.description,
      status: cat.status,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning("Name required", {
        description: "Please enter a category name.",
      });
      return;
    }
    setSaving(true);
    try {
      const url =
        editingId !== null
          ? `${API_BASE}/categories/${editingId}`
          : `${API_BASE}/categories`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Category Updated" : "Category Created");
        fetchCategories();
        setIsOpen(false);
      } else {
        toast.error("Failed", { description: "Something went wrong." });
      }
    } catch {
      toast.error("Server error", { description: "Could not save category." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" });
      toast.success("Category Deleted");
      fetchCategories();
    } catch {
      toast.error("Error", { description: "Could not delete category." });
    }
  };

  // Filter + search
  const filtered = categories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Select all on current page
  const allSelected =
    paginated.length > 0 &&
    paginated.every((c) => selected.includes(c.categories_id));
  const toggleSelectAll = () => {
    const ids = paginated.map((c) => c.categories_id);
    setSelected(
      allSelected
        ? selected.filter((id) => !ids.includes(id))
        : [...new Set([...selected, ...ids])],
    );
  };
  const toggleSelect = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const formatDate = (d?: string) =>
    d ? new Date(d).toISOString().split("T")[0] : "—";

  // Page number list
  const pageNums = () => {
    const nums: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1, 2, 3);
      if (page > 4) nums.push("...");
      if (page > 3 && page < totalPages - 1) nums.push(page);
      nums.push("...", totalPages);
    }
    return [...new Set(nums)];
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Categories
          </h1>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mt-0.5">
            Master Menu Classification System
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          + Add Category
        </Button>
      </div>

      {/* ── Main card ── */}
      <div className=" border border-zinc-200 bg-white overflow-hidden">
        {/* Search + filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search categories..."
              className="h-9 w-full  border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-[#CC543A] focus:ring-1 focus:ring-[#CC543A]/20 transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9  border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-600 outline-none focus:border-primary transition"
            title="Filter categories by status"
          >
            <option value="all">ALL STATUSES</option>
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
          </select>

          <button className="flex h-9 items-center gap-2 border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Advanced
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <Loader />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60">
                <th className="w-10 px-4 py-3">
                  <input
                    placeholder="Search categories..."
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4  border-zinc-300 accent-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Category Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Item Count
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-400"
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                paginated.map((cat) => {
                  const statusStr = String(cat.status ?? "").toLowerCase();
                  const inactive = statusStr === "inactive";
                  return (
                    <tr
                      key={cat.categories_id}
                      className={`border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/60 ${inactive ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          title="id"
                          type="checkbox"
                          checked={selected.includes(cat.categories_id)}
                          onChange={() => toggleSelect(cat.categories_id)}
                          className="h-4 w-4 border-zinc-300 accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-800">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-bold tracking-wide ${
                            statusStr === "active"
                              ? "border-primary/40 bg-primary/5 text-primary"
                              : "border-zinc-300 bg-zinc-50 text-zinc-400"
                          }`}
                        >
                          {statusStr.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-700">
                        {cat.item_count ?? "—"}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            className=" border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
                          >
                            Edit
                          </button>
                          <DeleteDialog
                            title="Delete Category"
                            description="This will permanently remove the category and all its items."
                            onDelete={() => handleDelete(cat.categories_id)}
                            trigger={<button>Delete</button>}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Footer — count + pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
              categories
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center  border border-zinc-200 text-zinc-400 hover:bg-zinc-50 disabled:opacity-30 transition"
              >
                ‹
              </button>
              {pageNums().map((n, i) =>
                n === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="px-1 text-zinc-400 text-xs"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`flex h-7 w-7 items-center justify-center  text-xs font-medium transition ${
                      page === n
                        ? "bg-primary text-white"
                        : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center  border border-zinc-200 text-zinc-400 hover:bg-zinc-50 disabled:opacity-30 transition"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Input
                label="Name"
                id="name"
                placeholder="Enter name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Textarea
                label="Description"
                id="description"
                placeholder="Enter description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
