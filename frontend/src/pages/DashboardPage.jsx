import { useNavigate } from "react-router-dom";

import { KpiCard } from "../components/KpiCard.jsx";
import { PhotoOverlay } from "../components/PhotoOverlay.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { useDrivers } from "../hooks/useDrivers.js";
import { useOrders, useOrderStats } from "../hooks/useOrders.js";
import { useTrucks } from "../hooks/useTrucks.js";

function AvailabilityBadge({ status }) {
  if (!status) return null;
  const available = status === "available";
  return (
    <span className={`text-[10px] font-semibold ${available ? "text-emerald-400" : "text-blue-400"}`}>
      {available ? "Available" : "On Trip"}
    </span>
  );
}

export default function DashboardPage() {
  const { data: stats } = useOrderStats();
  const { data: ordersRes, isLoading } = useOrders({ page_size: 50 });
  const { data: drivers = [] } = useDrivers();
  const { data: trucks = [] } = useTrucks();
  const navigate = useNavigate();
  const orders = ordersRes?.items || [];
  const driverStatusById = Object.fromEntries(drivers.map((d) => [d.id, d.status]));
  const truckStatusById = Object.fromEntries(trucks.map((t) => [t.id, t.status]));

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 px-6 py-7">
        <PhotoOverlay
          gradient="linear-gradient(90deg, rgba(2,6,23,0.95) 30%, rgba(2,6,23,0.55) 65%, rgba(2,6,23,0.15) 100%)"
          className="absolute inset-0"
        />
        <div className="relative z-10">
          <h1 className="font-condensed text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan operasional hari ini</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <KpiCard label="Orders Today" value={stats?.total ?? "-"} />
        <KpiCard label="Waiting Assignment" value={stats?.ORDER ?? "-"} accent="text-slate-300" />
        <KpiCard label="Assigned" value={stats?.ASSIGNED ?? "-"} accent="text-blue-400" />
        <KpiCard label="Arrived" value={stats?.ARRIVED ?? "-"} accent="text-amber-400" />
        <KpiCard label="Unloading" value={stats?.UNLOADING ?? "-"} accent="text-amber-400" />
        <KpiCard label="Completed Today" value={stats?.COMPLETED ?? "-"} accent="text-emerald-400" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Semua Order</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-4 py-2 font-semibold">Order</th>
              <th className="px-4 py-2 font-semibold">Customer</th>
              <th className="px-4 py-2 font-semibold">Truck</th>
              <th className="px-4 py-2 font-semibold">Driver</th>
              <th className="px-4 py-2 font-semibold">Posisi</th>
              <th className="px-4 py-2 font-semibold">Tujuan</th>
              <th className="px-4 py-2 font-semibold">ETA</th>
              <th className="px-4 py-2 font-semibold">Est. Bongkar</th>
              <th className="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/40 cursor-pointer"
              >
                <td className="px-4 py-2.5 font-mono-data text-slate-200">{o.order_no}</td>
                <td className="px-4 py-2.5 text-slate-300">{o.customer_name}</td>
                <td className="px-4 py-2.5 text-slate-300">
                  {o.truck_plate ? (
                    <div className="flex flex-col">
                      <span>{o.truck_plate}</span>
                      <AvailabilityBadge status={truckStatusById[o.truck_id]} />
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-300">
                  {o.driver_name ? (
                    <div className="flex flex-col">
                      <span>{o.driver_name}</span>
                      <AvailabilityBadge status={driverStatusById[o.driver_id]} />
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-300">{o.current_location || "-"}</td>
                <td className="px-4 py-2.5 text-slate-300">{o.unload_location}</td>
                <td className="px-4 py-2.5 font-mono-data text-slate-300">{o.eta || "-"}</td>
                <td className="px-4 py-2.5 text-slate-400">{o.est_unload_start || "-"}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  Belum ada order. Buat order baru dari menu Orders.
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
