import { Pencil, Truck as TruckIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { DeleteButton } from "../components/DeleteButton.jsx";
import { EditRecordModal } from "../components/EditRecordModal.jsx";
import { MasterDataTable } from "../components/MasterDataTable.jsx";
import { useCreateTruck, useDeleteTruck, useTrucks, useUpdateTruck } from "../hooks/useTrucks.js";
import { useOrders } from "../hooks/useOrders.js";

export default function TrucksPage() {
  const { data: trucks = [], isLoading } = useTrucks();
  const { data: activeOrders } = useOrders({ page_size: 200 });
  const createTruck = useCreateTruck();
  const updateTruck = useUpdateTruck();
  const deleteTruck = useDeleteTruck();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState("");

  if (isLoading) return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;

  const orders = activeOrders?.items || [];
  const q = search.trim().toLowerCase();
  const filteredTrucks = trucks.filter(
    (t) => !q || t.plate.toLowerCase().includes(q) || (t.type || "").toLowerCase().includes(q),
  );

  function openEdit(truck) {
    setEditError("");
    setEditing(truck);
  }

  function saveEdit(form) {
    setEditError("");
    updateTruck.mutate(
      { id: editing.id, data: { plate: form.plate, type: form.type || undefined } },
      {
        onSuccess: () => setEditing(null),
        onError: (err) => setEditError(err.message || "Gagal menyimpan perubahan."),
      },
    );
  }

  return (
    <>
      <MasterDataTable
        title="Trucks"
        icon={TruckIcon}
        addLabel="Truck Baru"
        hint="Truck berstatus Available akan muncul sebagai pilihan saat assign order."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari no. polisi atau tipe…"
        fields={[
          { key: "plate", label: "No. Polisi" },
          { key: "type", label: "Tipe Truck" },
        ]}
        onAdd={(form) => createTruck.mutate(form)}
        columns={["No. Polisi", "Tipe", "Status", "Order Saat Ini", "Aksi"]}
        rows={filteredTrucks.map((t) => {
          const currentOrder = orders.find(
            (o) => o.truck_id === t.id && o.status !== "COMPLETED" && o.status !== "ORDER",
          );
          return (
            <tr
              key={t.id}
              onClick={() => openEdit(t)}
              className="border-b border-slate-800/70 last:border-0 cursor-pointer hover:bg-slate-800/40"
            >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${currentOrder.id}`);
                    }}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(t);
                    }}
                    title="Lihat / Edit"
                    className="text-slate-500 hover:text-amber-400"
                  >
                    <Pencil size={15} />
                  </button>
                  <DeleteButton
                    mutation={deleteTruck}
                    id={t.id}
                    confirmMessage={`Hapus truck "${t.plate}"?`}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      />

      {editing && (
        <EditRecordModal
          title={`Edit Truck — ${editing.plate}`}
          fields={[
            { key: "plate", label: "No. Polisi" },
            { key: "type", label: "Tipe Truck" },
          ]}
          record={editing}
          extraHint={`Status saat ini: ${editing.status === "available" ? "Available" : "On Trip"} (status berubah otomatis mengikuti alur order).`}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          isSaving={updateTruck.isPending}
          error={editError}
          historyEntityType="truck"
        />
      )}
    </>
  );
}
