import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

import { KpiCard } from "../components/KpiCard.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { useCustomers } from "../hooks/useCustomers.js";
import { useDrivers } from "../hooks/useDrivers.js";
import { useOrders, useOrderStats } from "../hooks/useOrders.js";
import { useTrucks } from "../hooks/useTrucks.js";
import { ordersApi } from "../api/orders.js";
import { exportOrdersExcel } from "../lib/exportExcel.js";
import { STAGE_LABEL, STAGES } from "../lib/constants.js";

const PREVIEW_PAGE_SIZE = 200;

const emptyFilters = { status: "ALL", customer_id: "", date_from: "", date_to: "" };

export default function ReportingPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const orderQueryParams = {
    status: filters.status === "ALL" ? undefined : filters.status,
    customer_id: filters.customer_id || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  };
  const statsParams = {
    customer_id: filters.customer_id || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  };

  const { data: ordersRes, isLoading } = useOrders({ ...orderQueryParams, page_size: PREVIEW_PAGE_SIZE });
  const { data: stats } = useOrderStats(statsParams);
  const { data: customers = [] } = useCustomers();
  const { data: drivers = [] } = useDrivers();
  const { data: trucks = [] } = useTrucks();

  const filteredOrders = ordersRes?.items || [];
  const totalMatching = ordersRes?.total ?? filteredOrders.length;
  const counts = { total: stats?.total ?? 0, ...STAGES.reduce((acc, s) => ({ ...acc, [s]: stats?.[s] ?? 0 }), {}) };

  async function downloadExcel() {
    setExporting(true);
    setExportError("");
    try {
      const allOrders = await ordersApi.listAll(orderQueryParams);
      exportOrdersExcel({ orders: allOrders, drivers, trucks, counts });
    } catch (err) {
      setExportError(err.message || "Gagal menyiapkan file Excel.");
    } finally {
      setExporting(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
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
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={downloadExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-semibold text-sm px-4 py-2 rounded-md"
          >
            <Download size={16} /> {exporting ? "Menyiapkan…" : "Download Excel"}
          </button>
          {exportError && <p className="text-xs text-red-400">{exportError}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Status</span>
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="mt-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100"
          >
            <option value="ALL">Semua Status</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Customer</span>
          <select
            value={filters.customer_id}
            onChange={(e) => updateFilter("customer_id", e.target.value)}
            className="mt-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100"
          >
            <option value="">Semua Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tanggal Kirim Dari</span>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilter("date_from", e.target.value)}
            className="mt-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Sampai</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            className="mt-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100"
          />
        </label>

        {(filters.status !== "ALL" || filters.customer_id || filters.date_from || filters.date_to) && (
          <button
            onClick={() => setFilters(emptyFilters)}
            className="text-xs text-slate-500 hover:text-slate-300 underline pb-2"
          >
            Reset filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {STAGES.map((s) => (
          <KpiCard key={s} label={STAGE_LABEL[s]} value={stats?.[s] ?? 0} />
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-200">
            Preview Data Order ({filteredOrders.length}{totalMatching > filteredOrders.length ? ` dari ${totalMatching}` : ""})
          </h2>
          {totalMatching > filteredOrders.length && (
            <p className="text-xs text-slate-500">
              Preview dibatasi {PREVIEW_PAGE_SIZE} baris — Download Excel untuk semua data.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
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
            {!isLoading && filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada order untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
