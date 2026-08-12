import { MapPin, Navigation, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { RouteStrip } from "../components/RouteStrip.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { useOrders } from "../hooks/useOrders.js";

export default function LiveMonitorPage() {
  const navigate = useNavigate();
  const { data: assigned } = useOrders({ status: "ASSIGNED", page_size: 100 }, { refetchInterval: 12000 });
  const { data: arrived } = useOrders({ status: "ARRIVED", page_size: 100 }, { refetchInterval: 12000 });
  const { data: unloading } = useOrders({ status: "UNLOADING", page_size: 100 }, { refetchInterval: 12000 });

  const active = [...(assigned?.items || []), ...(arrived?.items || []), ...(unloading?.items || [])].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Radar size={20} className="text-amber-400" />
        <div>
          <h1 className="font-condensed text-2xl font-bold text-slate-100">Live Delivery Monitor</h1>
          <p className="text-sm text-slate-500">{active.length} truck sedang dalam perjalanan</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-4 py-2.5 font-semibold">Order</th>
              <th className="px-4 py-2.5 font-semibold">Customer</th>
              <th className="px-4 py-2.5 font-semibold">Truck</th>
              <th className="px-4 py-2.5 font-semibold">Driver</th>
              <th className="px-4 py-2.5 font-semibold">Posisi Saat Ini</th>
              <th className="px-4 py-2.5 font-semibold">Tujuan</th>
              <th className="px-4 py-2.5 font-semibold">ETA</th>
              <th className="px-4 py-2.5 font-semibold">Progress</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {active.map((o) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/40 cursor-pointer"
              >
                <td className="px-4 py-3 font-mono-data text-slate-200">{o.order_no}</td>
                <td className="px-4 py-3 text-slate-300">{o.customer_name}</td>
                <td className="px-4 py-3 text-slate-300">{o.truck_plate || "-"}</td>
                <td className="px-4 py-3 text-slate-300">{o.driver_name || "-"}</td>
                <td className="px-4 py-3 text-slate-300 flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-400" /> {o.current_location || "-"}
                </td>
                <td className="px-4 py-3 text-slate-300">{o.unload_location}</td>
                <td className="px-4 py-3">
                  <div className="font-mono-data text-slate-200">{o.eta || "-"}</div>
                </td>
                <td className="px-4 py-3 w-40">
                  <RouteStrip status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Belum ada truck yang sedang jalan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-500 flex items-center gap-2">
        <Navigation size={16} className="text-slate-600 shrink-0" />
        Posisi & ETA di atas diinput manual oleh admin/driver — klik order untuk update.
      </div>
    </div>
  );
}
