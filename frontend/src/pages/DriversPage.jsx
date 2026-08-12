import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { MasterDataTable } from "../components/MasterDataTable.jsx";
import { useCreateDriver, useDrivers } from "../hooks/useDrivers.js";
import { useOrders } from "../hooks/useOrders.js";

export default function DriversPage() {
  const { data: drivers = [], isLoading } = useDrivers();
  const { data: activeOrders } = useOrders({ page_size: 200 });
  const createDriver = useCreateDriver();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;

  const orders = activeOrders?.items || [];

  return (
    <MasterDataTable
      title="Drivers"
      icon={Users}
      addLabel="Driver Baru"
      hint="Driver berstatus Available akan muncul sebagai pilihan saat assign order. Isi username & password untuk membuat akses login driver (opsional)."
      fields={[
        { key: "name", label: "Nama Driver" },
        { key: "phone", label: "No. HP" },
        { key: "username", label: "Username (opsional)" },
        { key: "password", label: "Password (opsional)", type: "password" },
      ]}
      onAdd={(form) =>
        createDriver.mutate({
          name: form.name,
          phone: form.phone || undefined,
          username: form.username || undefined,
          password: form.password || undefined,
        })
      }
      columns={["Nama", "No. HP", "Login", "Status", "Order Saat Ini"]}
      rows={drivers.map((d) => {
        const currentOrder = orders.find(
          (o) => o.driver_id === d.id && o.status !== "COMPLETED" && o.status !== "ORDER",
        );
        return (
          <tr key={d.id} className="border-b border-slate-800/70 last:border-0">
            <td className="px-4 py-2.5 text-slate-200">{d.name}</td>
            <td className="px-4 py-2.5 font-mono-data text-slate-400">{d.phone || "-"}</td>
            <td className="px-4 py-2.5">
              <span className={`text-xs font-semibold ${d.has_login ? "text-emerald-400" : "text-slate-600"}`}>
                {d.has_login ? "Aktif" : "Belum ada"}
              </span>
            </td>
            <td className="px-4 py-2.5">
              <span className={`text-xs font-semibold ${d.status === "available" ? "text-emerald-400" : "text-blue-400"}`}>
                {d.status === "available" ? "Available" : "On Trip"}
              </span>
            </td>
            <td className="px-4 py-2.5">
              {currentOrder ? (
                <button
                  onClick={() => navigate(`/orders/${currentOrder.id}`)}
                  className="font-mono-data text-amber-400 hover:text-amber-300"
                >
                  {currentOrder.order_no}{" "}
                  <span className="text-slate-500 font-sans">({currentOrder.customer_name})</span>
                </button>
              ) : (
                <span className="text-slate-600">-</span>
              )}
            </td>
          </tr>
        );
      })}
    />
  );
}
