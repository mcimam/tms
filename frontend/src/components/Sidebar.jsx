import {
  Building2, ChevronLeft, ChevronRight, FileSpreadsheet, LayoutDashboard, LogOut, Package, Radar, Smartphone,
  Truck as TruckIcon, Users, X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/live-monitor", label: "Live Delivery Monitor", icon: Radar },
  { to: "/reporting", label: "Reporting", icon: FileSpreadsheet },
];

const masterItems = [
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trucks", label: "Trucks", icon: TruckIcon },
];

function NavItem({ to, label, icon: Icon, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 py-2.5 text-sm font-medium border-l-2 transition-colors ${
          collapsed ? "justify-center px-0" : "px-5"
        } ${
          isActive
            ? "border-amber-400 bg-slate-900 text-amber-300"
            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
        }`
      }
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

// collapsed: desktop icon-only mode. onToggleCollapse: show the collapse chevron (desktop instance).
// onClose: show a close (X) button instead — used by the mobile drawer instance.
// onNavigate: fires when a nav link is clicked, used to auto-close the mobile drawer.
export function Sidebar({ collapsed = false, onToggleCollapse, onClose, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <div
      className={`shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-full relative overflow-hidden transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div
        className={`py-5 border-b border-slate-800 relative z-10 flex items-center ${
          collapsed ? "justify-center px-0" : "justify-between px-5"
        }`}
      >
        {!collapsed && (
          <div>
            <p className="font-condensed text-xl font-bold text-slate-100 tracking-wide leading-none">TRACKIT</p>
            <p className="text-[11px] text-slate-500 mt-1 tracking-wide">Trucking Ops Console</p>
          </div>
        )}
        {onClose ? (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 p-1 shrink-0">
            <X size={18} />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-900 shrink-0"
              title={collapsed ? "Perluas menu" : "Ciutkan menu"}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )
        )}
      </div>
      <nav className="flex-1 py-3 relative z-10 overflow-y-auto">
        {items.map((it) => (
          <NavItem key={it.to} {...it} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        {!collapsed ? (
          <p className="px-5 pt-4 pb-1 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Master Data</p>
        ) : (
          <div className="my-2 mx-4 border-t border-slate-800" />
        )}
        {masterItems.map((it) => (
          <NavItem key={it.to} {...it} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="relative z-10 px-3 pb-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800">
            <Smartphone size={14} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-300 truncate">{user?.full_name}</span>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold border border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-950"
        >
          <LogOut size={15} /> {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}
