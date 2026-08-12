import { Pencil, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { DeleteButton } from "../components/DeleteButton.jsx";
import { EditRecordModal } from "../components/EditRecordModal.jsx";
import { MasterDataTable } from "../components/MasterDataTable.jsx";
import { useCreateDriver, useDeleteDriver, useDrivers, useUpdateDriver } from "../hooks/useDrivers.js";
import { useOrders } from "../hooks/useOrders.js";

export default function DriversPage() {
  const { data: drivers = [], isLoading } = useDrivers();
  const { data: activeOrders } = useOrders({ page_size: 200 });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState("");

  if (isLoading) return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;

  const orders = activeOrders?.items || [];
  const q = search.trim().toLowerCase();
  const filteredDrivers = drivers.filter(
    (d) => !q || d.name.toLowerCase().includes(q) || (d.phone || "").toLowerCase().includes(q),
  );

  function openEdit(driver) {
    setEditError("");
    setEditing(driver);
  }

  function saveEdit(form) {
    setEditError("");
    updateDriver.mutate(
      {
        id: editing.id,
        data: {
          name: form.name,
          phone: form.phone || undefined,
          username: form.username || undefined,
          password: form.password || undefined,
        },
      },
      {
        onSuccess: () => setEditing(null),
        onError: (err) => setEditError(err.message || "Gagal menyimpan perubahan."),
      },
    );
  }

  return (
    <>
      <MasterDataTable
        title="Drivers"
        icon={Users}
        addLabel="Driver Baru"
        hint="Driver berstatus Available akan muncul sebagai pilihan saat assign order. Isi username & password untuk membuat akses login driver (opsional)."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama atau no. HP…"
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
        columns={["Nama", "No. HP", "Login", "Status", "Order Saat Ini", "Aksi"]}
        rows={filteredDrivers.map((d) => {
          const currentOrder = orders.find(
            (o) => o.driver_id === d.id && o.status !== "COMPLETED" && o.status !== "ORDER",
          );
          return (
            <tr
              key={d.id}
              onClick={() => openEdit(d)}
              className="border-b border-slate-800/70 last:border-0 cursor-pointer hover:bg-slate-800/40"
            >
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
                      openEdit(d);
                    }}
                    title="Lihat / Edit"
                    className="text-slate-500 hover:text-amber-400"
                  >
                    <Pencil size={15} />
                  </button>
                  <DeleteButton
                    mutation={deleteDriver}
                    id={d.id}
                    confirmMessage={`Hapus driver "${d.name}"?`}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      />

      {editing && (
        <EditRecordModal
          title={`Edit Driver — ${editing.name}`}
          fields={[
            { key: "name", label: "Nama Driver" },
            { key: "phone", label: "No. HP" },
            { key: "username", label: "Username baru (opsional)" },
            { key: "password", label: "Password baru (opsional)", type: "password" },
          ]}
          record={{ ...editing, username: "", password: "" }}
          extraHint={`Login saat ini: ${editing.has_login ? "aktif" : "belum ada"}. Isi username & password hanya jika ingin membuat/mengubah akses login.`}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          isSaving={updateDriver.isPending}
          error={editError}
          historyEntityType="driver"
        />
      )}
    </>
  );
}
