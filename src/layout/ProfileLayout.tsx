import { Icon, ICONS } from "../config/icons";
import { useAuth } from "../context/AuthContext";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const tabs = [
  { key: "account", label: "Profile", icon: ICONS.account, path: "/profile/account" },
  { key: "payment", label: "Payment Methods", icon: ICONS.payments, path: "/profile/payment" },
];

export default function ProfileLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (location.pathname === "/profile" || location.pathname === "/profile/") {
    return <Navigate to="/profile/account" replace />;
  }

  if (!user) return null;

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path));

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-full bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Main Body ── */}
        <div className="flex gap-6 items-start">

          {/* ── Sidebar ── */}
          <div className="w-52 h-117 shrink-0 bg-white border border-zinc-100 shadow-sm overflow-hidden">

            {/* User info */}
            <div className="flex flex-col items-center px-4 pt-7 pb-5">
              {/* Avatar */}
              <div className="relative group cursor-pointer">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-[#CC543A] flex items-center justify-center ring-4 ring-[#CC543A]/20">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white tracking-wide">
                      {initials || "A"}
                    </span>
                  )}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <Icon icon={ICONS.account} width={16} className="text-white" />
                  <span className="text-[9px] text-white font-medium text-center leading-tight px-1">
                    Change photo
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-zinc-800 text-center truncate w-full">
                {user.name}
              </p>
              <p className="text-xs text-zinc-400 text-center truncate w-full mt-0.5">
                {user.email}
              </p>
            </div>

            <Separator className="bg-zinc-100" />

            {/* Nav links */}
            <nav className="flex flex-col py-3 px-2 gap-0.5">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all text-left w-full ${
                      isActive
                        ? "bg-[#CC543A] text-white shadow-sm"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                    }`
                  }
                >
                  <Icon icon={tab.icon} width={15} className="shrink-0" />
                  <span className="leading-tight">{tab.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* ── Right Panel ── */}
          <div className="flex-1 min-w-0">
            {/* Page title */}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-zinc-800">
                {activeTab?.label ?? "Profile"}
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                {activeTab?.key === "payment"
                  ? "Manage your Razorpay integration for accepting payments."
                  : "Update your personal information and preferences."}
              </p>
            </div>

            {/* Nested route content */}
            <div className="bg-white max-w-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <Outlet />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}