import {
  Building2, FileSpreadsheet, LayoutDashboard, LogOut, Package, Radar, Smartphone, Truck as TruckIcon, Users,
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

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-2 transition-colors ${
          isActive
            ? "border-amber-400 bg-slate-900 text-amber-300"
            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="w-56 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-full relative overflow-hidden">
      <div className="px-5 py-5 border-b border-slate-800 relative z-10">
        <p className="font-condensed text-xl font-bold text-slate-100 tracking-wide leading-none">TRACKIT</p>
        <p className="text-[11px] text-slate-500 mt-1 tracking-wide">Trucking Ops Console</p>
      </div>
      <nav className="flex-1 py-3 relative z-10">
        {items.map((it) => (
          <NavItem key={it.to} {...it} />
        ))}
        <p className="px-5 pt-4 pb-1 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Master Data</p>
        {masterItems.map((it) => (
          <NavItem key={it.to} {...it} />
        ))}
      </nav>
      <div className="relative z-10 px-3 pb-3 space-y-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800">
          <Smartphone size={14} className="text-slate-500 shrink-0" />
          <span className="text-xs text-slate-300 truncate">{user?.full_name}</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold border border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-950"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );
}
