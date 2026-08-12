import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

import { KpiCard } from "../components/KpiCard.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { useDrivers } from "../hooks/useDrivers.js";
import { useOrders, useOrderStats } from "../hooks/useOrders.js";
import { useTrucks } from "../hooks/useTrucks.js";
import { exportOrdersExcel } from "../lib/exportExcel.js";
import { STAGE_LABEL, STAGES } from "../lib/constants.js";

export default function ReportingPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data: ordersRes } = useOrders({ status: statusFilter === "ALL" ? undefined : statusFilter, page_size: 500 });
  const { data: stats } = useOrderStats();
  const { data: drivers = [] } = useDrivers();
  const { data: trucks = [] } = useTrucks();

  const filteredOrders = ordersRes?.items || [];
  const counts = { total: stats?.total ?? 0, ...STAGES.reduce((acc, s) => ({ ...acc, [s]: stats?.[s] ?? 0 }), {}) };

  function downloadExcel() {
    exportOrdersExcel({ orders: filteredOrders, drivers, trucks, counts });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-amber-400" />
          <div>
            <h1 className="font-condensed text-2xl font-bold text-slate-100">Reporting</h1>
            <p className="text-xs text-slate-500">Export data order, driver, dan truck ke Excel</p>
          </div>
        </div>
        <button
          onClick={downloadExcel}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm px-4 py-2 rounded-md"
        >
          <Download size={16} /> Download Excel
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Filter Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100"
        >
          <option value="ALL">Semua Status</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        {STAGES.map((s) => (
          <KpiCard key={s} label={STAGE_LABEL[s]} value={stats?.[s] ?? 0} />
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Preview Data Order ({filteredOrders.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-4 py-2 font-semibold">Order</th>
              <th className="px-4 py-2 font-semibold">Customer</th>
              <th className="px-4 py-2 font-semibold">Driver</th>
              <th className="px-4 py-2 font-semibold">Truck</th>
              <th className="px-4 py-2 font-semibold">Tujuan</th>
              <th className="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id} className="border-b border-slate-800/70 last:border-0">
                <td className="px-4 py-2.5 font-mono-data text-slate-200">{o.order_no}</td>
                <td className="px-4 py-2.5 text-slate-300">{o.customer_name}</td>
                <td className="px-4 py-2.5 text-slate-300">{o.driver_name || "-"}</td>
                <td className="px-4 py-2.5 text-slate-300">{o.truck_plate || "-"}</td>
                <td className="px-4 py-2.5 text-slate-300">{o.unload_location}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada order untuk status ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
