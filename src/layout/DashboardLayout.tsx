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
import Logoutbox from "../pages/Logoutbox";
import { Button } from "@/components/ui/button";

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
          collapsed ? "w-15" : "w-65"
        } transition-all duration-300 bg-[#F7F7F7] border-r border-zinc-100 flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4">
          <img src="/auth/dashlogo.png" alt="" />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto ">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 px-3 ${
                  isActive ? "text-white" : "text-black hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                <Icon
                  icon={item.icon}
                  width={20}
                  className={`shrink-0 ${isActive ? "text-white" : "text-black"}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Profile section */}
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/profile")}
            className={`h-auto w-full justify-start gap-3 px-2 py-2 text-left ${
              pathname === "/profile"
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
          </Button>
        </div>

        {/* Bottom — New Reservation + Logout */}
        <div className="px-2 pb-4 space-y-1 border-t border-zinc-100 pt-3">
          {!collapsed && (
            <Button  className="w-full gap-2 px-3 font-semibold text-white">
              <span>+ New Reservation</span>
            </Button>
          )}

          <Logoutbox collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 border-b border-zinc-100 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(!collapsed)}
              className="text-zinc-400"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon
                icon={collapsed ? ICONS.chevronRight : ICONS.chevronLeft}
                width={18}
              />
            </Button>
          </div>
          <div className="flex items-center gap-3">

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  title="Open profile"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className=" font-semibold">{initials || "A"}</span>
                    )}
                  </div>
                  <span className="hidden text-sm text-zinc-600 md:block">
                    {user?.name || "Admin"}
                  </span>
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-52 p-0 overflow-hidden gap-0"
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Options */}
                <div>
                  {/* Profile */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/profile")}
                  >
                    <Icon
                      icon={ICONS.account}
                      width={16}
                      className="w-full justify-start gap-3 "
                    />
                    Profile
                  </Button>

                  {/* Settings — disabled */}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled
                    className="w-full justify-start gap-3 "
                  >
                    <Icon
                      icon={ICONS.setting ?? ICONS.question}
                      width={16}
                      className="text-zinc-300"
                    />
                    Settings
                    <span className="ml-auto ">
                      Soon
                    </span>
                  </Button>

                  <div className="my-1 border-t border-zinc-100" />

                  <Logoutbox collapsed={collapsed} onLogout={handleLogout} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
