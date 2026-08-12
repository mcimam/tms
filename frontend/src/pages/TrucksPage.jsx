import { Truck as TruckIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DeleteButton } from "../components/DeleteButton.jsx";
import { MasterDataTable } from "../components/MasterDataTable.jsx";
import { useCreateTruck, useDeleteTruck, useTrucks } from "../hooks/useTrucks.js";
import { useOrders } from "../hooks/useOrders.js";

export default function TrucksPage() {
  const { data: trucks = [], isLoading } = useTrucks();
  const { data: activeOrders } = useOrders({ page_size: 200 });
  const createTruck = useCreateTruck();
  const deleteTruck = useDeleteTruck();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;

  const orders = activeOrders?.items || [];

  return (
    <MasterDataTable
      title="Trucks"
      icon={TruckIcon}
      addLabel="Truck Baru"
      hint="Truck berstatus Available akan muncul sebagai pilihan saat assign order."
      fields={[
        { key: "plate", label: "No. Polisi" },
        { key: "type", label: "Tipe Truck" },
      ]}
      onAdd={(form) => createTruck.mutate(form)}
      columns={["No. Polisi", "Tipe", "Status", "Order Saat Ini", "Aksi"]}
      rows={trucks.map((t) => {
        const currentOrder = orders.find(
          (o) => o.truck_id === t.id && o.status !== "COMPLETED" && o.status !== "ORDER",
        );
        return (
          <tr key={t.id} className="border-b border-slate-800/70 last:border-0">
            <td className="px-4 py-2.5 font-mono-data text-slate-200">{t.plate}</td>
            <td className="px-4 py-2.5 text-slate-300">{t.type || "-"}</td>
            <td className="px-4 py-2.5">
              <span className={`text-xs font-semibold ${t.status === "available" ? "text-emerald-400" : "text-blue-400"}`}>
                {t.status === "available" ? "Available" : "On Trip"}
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
            <td className="px-4 py-2.5">
              <DeleteButton
                mutation={deleteTruck}
                id={t.id}
                confirmMessage={`Hapus truck "${t.plate}"?`}
              />
            </td>
          </tr>
        );
      })}
    />
  );
}
