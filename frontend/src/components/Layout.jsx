import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar.jsx";

export function Layout() {
  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
