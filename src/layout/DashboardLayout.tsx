"use client";

import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Icon, ICONS } from "../config/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: ICONS.dashboard, path: "/dashboard" },
  { label: "Category Management", icon: ICONS.forkspoon, path: "/category" },
  { label: "Table Management", icon: ICONS.tableMgmt, path: "/tables" },
  { label: "QR Code Generation", icon: ICONS.qrCode, path: "/qr-code" },
  { label: "Stock / Inventory", icon: ICONS.inventory, path: "/inventory" },
  { label: "Payments", icon: ICONS.payments, path: "/payments" },
  { label: "Live Orders Tracking", icon: ICONS.liveOrders, path: "/orders" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
const [logoutOpen, setLogoutOpen] = useState(false);

  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-76"
        } transition-all duration-300 bg-[#F7F7F7] border-r border-zinc-100 flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4">
          <img src="/auth/dashlogo.png" alt="" />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm  transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-black hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                <Icon
                  icon={item.icon}
                  width={20}
                  className={`shrink-0 ${isActive ? "text-white" : "text-black"}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Profile section */}
        <div className="mx-2 mb-2 rounded-xl border border-zinc-200 bg-white p-2">
          <button
            onClick={() => navigate("/profile")}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
              pathname === "/profile" ? "bg-primary/20" : "hover:bg-zinc-50"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold">{initials || "A"}</span>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {user?.name || "Admin"}
                </p>
                <p className="truncate text-xs text-zinc-500">{user?.email}</p>
              </div>
            )}
          </button>
        </div>

        {/* Bottom — New Reservation + Logout */}
        <div className="px-2 pb-4 space-y-1 border-t border-zinc-100 pt-3">
          {!collapsed && (
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5  font-semibold bg-primary text-white hover:bg-primary/80 transition">
              <span>+ New Reservation</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg  font-medium text-zinc-500 hover:bg-primary/20 hover:text-primary transition"
          >
            <Icon icon={ICONS.logout} width={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 border-b border-zinc-100 px-6 py-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon
                icon={collapsed ? ICONS.chevronRight : ICONS.chevronLeft}
                width={18}
              />
            </button>
          </div>
<div className="flex items-center gap-3">
  <Icon icon={ICONS.question} width={18} className="text-black/50" />

  <Popover>
    <PopoverTrigger asChild>
      <button className="flex items-center gap-2" title="Open profile">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className=" font-semibold">{initials || "A"}</span>
          )}
        </div>
        <span className="hidden text-sm text-zinc-600 md:block">{user?.name || "Admin"}</span>
      </button>
    </PopoverTrigger>

    <PopoverContent align="end" sideOffset={8} className="w-52 p-0 overflow-hidden">
      {/* User info header */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-900 truncate">{user?.name || "Admin"}</p>
        <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
      </div>

      {/* Options */}
      <div className="py-1">
        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition"
        >
          <Icon icon={ICONS.account} width={16} className="text-zinc-400" />
          Profile
        </button>

        {/* Settings — disabled */}
        <button
          disabled
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 cursor-not-allowed"
        >
          <Icon icon={ICONS.setting ?? ICONS.question} width={16} className="text-zinc-300" />
          Settings
          <span className="ml-auto bg-zinc-100 text-zinc-400 px-1.5 py-0.5">Soon</span>
        </button>

        <div className="my-1 border-t border-zinc-100" />

        {/* Logout */}
        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-primary/20 transition"
        >
          <Icon icon={ICONS.logout} width={16} className="text-primary" />
          Logout
        </button>
      </div>
    </PopoverContent>
  </Popover>
</div>

{/* Logout Confirmation Dialog */}
{logoutOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div className="w-80 bg-white shadow-xl p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mx-auto mb-4">
        <Icon icon={ICONS.logout} width={22} className="text-primary" />
      </div>
      <h3 className="text-center text-base font-semibold text-zinc-900">Confirm Logout</h3>
      <p className="text-center text-sm text-zinc-400 mt-1 mb-6">
        Are you sure you want to log out of your account?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setLogoutOpen(false)}
          className="flex-1 border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => { setLogoutOpen(false); handleLogout(); }}
          className="flex-1 bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/80 transition"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
