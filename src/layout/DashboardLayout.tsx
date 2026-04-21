"use client";

import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Icon, ICONS } from "../config/icons";
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
                    ? "bg-[#CC543A] text-white"
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
              pathname === "/profile" ? "bg-[#CC543A]/10" : "hover:bg-zinc-50"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CC543A]/10 text-[#CC543A]">
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
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[16px] font-semibold bg-[#CC543A] text-white hover:bg-[#b8472f] transition">
              <span>+ New Reservation</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[16px] font-medium text-zinc-500 hover:bg-red-50 hover:text-red-500 transition"
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
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2"
              title="Open profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CC543A]/10 text-[#CC543A]">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-semibold">
                    {initials || "A"}
                  </span>
                )}
              </div>
              <span className="hidden text-sm text-zinc-600 md:block">
                {user?.name || "Admin"}
              </span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
