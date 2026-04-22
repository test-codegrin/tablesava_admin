import { Icon, ICONS } from "../config/icons";
import { useAuth } from "../context/AuthContext";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";

const tabs = [
  { key: "account", label: "Account Details", icon: ICONS.account, path: "/profile/account" },
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Hero Banner ── */}
        {/* <div className="relative bg-primary rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between">
       
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/20 blur-2xl" />
          </div>

         
          <div className="relative flex items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="h-20 w-20 rounded-xl overflow-hidden ring-4 ring-white/30 bg-white/20 flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{initials || "A"}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                <Icon icon={ICONS.account} width={18} className="text-white" />
                <span className="text-[9px] text-white font-medium text-center leading-tight px-1">
                  Change photo
                </span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-400 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                Pro Member
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
                Profile Overview
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Welcome to your{" "}
                <span className="text-green-300">Chromatic</span>
                <br />profile
              </h1>
              <p className="text-sm text-white/70 mt-2 max-w-xs">
                Manage your account details and payment settings from one polished dashboard.
              </p>
            </div>
          </div>

          
          <div className="relative hidden md:block bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-5 min-w-[180px] border border-white/20">
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Status</p>
              <p className="text-xl font-bold text-white mt-0.5">Pro</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Account</p>
              <p className="text-base font-semibold text-white mt-0.5">{user.email?.split("@")[0]}</p>
            </div>
          </div>
        </div> */}

        {/* ── Main Body ── */}
        <div className="flex gap-6 items-start">

          {/* ── Sidebar ── */}
          <div className="w-52 h-150 shrink-0 bg-white border border-zinc-100 shadow-sm overflow-hidden">
            {/* User info */}
            <div className="flex flex-col items-center px-4 pt-8 pb-6 border-b border-zinc-100">
            <div className="relative group cursor-pointer">
              <div className="h-24 w-24 overflow-hidden bg-zinc-100 flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-zinc-400">
                    {initials || "A"}
                  </span>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                <Icon icon={ICONS.account} width={18} className="text-white" />
                <span className="text-[10px] text-white font-medium text-center leading-tight px-1">
                  Click to change photo
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-800 text-center truncate w-full">
              {user.name}
            </p>
            <p className="text-xs text-zinc-400 text-center truncate w-full">
              {user.email}
            </p>
          </div>

            {/* Nav links */}
            <nav className="flex flex-col py-3 px-2 gap-0.5">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition text-left w-full ${
                      isActive
                        ? "border-l-4 border-[#CC543A] bg-[#CC543A]/5 text-primary"
                        : "border-l-4 border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
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
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-800">
                {activeTab?.label ?? "Profile"}
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Keep your information polished and up to date.
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