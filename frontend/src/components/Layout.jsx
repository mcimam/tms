import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar.jsx";

const COLLAPSE_KEY = "trackit_sidebar_collapsed";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-slate-300 hover:text-slate-100">
            <Menu size={20} />
          </button>
          <p className="font-condensed text-lg font-bold text-slate-100 tracking-wide">TRACKIT</p>
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
