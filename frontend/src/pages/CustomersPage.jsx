import { Building2, Pencil } from "lucide-react";
import { useState } from "react";

import { DeleteButton } from "../components/DeleteButton.jsx";
import { EditRecordModal } from "../components/EditRecordModal.jsx";
import { MasterDataTable } from "../components/MasterDataTable.jsx";
import { useCreateCustomer, useCustomers, useDeleteCustomer, useUpdateCustomer } from "../hooks/useCustomers.js";

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState("");

  if (isLoading) return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;

  const q = search.trim().toLowerCase();
  const filteredCustomers = customers.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || (c.contact || "").toLowerCase().includes(q),
  );

  function openEdit(customer) {
    setEditError("");
    setEditing(customer);
  }

  function saveEdit(form) {
    setEditError("");
    updateCustomer.mutate(
      { id: editing.id, data: { name: form.name, contact: form.contact || undefined } },
      {
        onSuccess: () => setEditing(null),
        onError: (err) => setEditError(err.message || "Gagal menyimpan perubahan."),
      },
    );
  }

  return (
    <>
      <MasterDataTable
        title="Customers"
        icon={Building2}
        addLabel="Customer Baru"
        hint="Daftar customer akan muncul sebagai pilihan saat membuat order baru."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama atau kontak…"
        fields={[
          { key: "name", label: "Nama Customer" },
          { key: "contact", label: "Kontak (Nama - No. HP)" },
        ]}
        onAdd={(form) => createCustomer.mutate(form)}
        columns={["Nama Customer", "Kontak", "Aksi"]}
        rows={filteredCustomers.map((c) => (
          <tr
            key={c.id}
            onClick={() => openEdit(c)}
            className="border-b border-slate-800/70 last:border-0 cursor-pointer hover:bg-slate-800/40"
          >
            <td className="px-4 py-2.5 text-slate-200">{c.name}</td>
            <td className="px-4 py-2.5 text-slate-400">{c.contact || "-"}</td>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                  title="Lihat / Edit"
                  className="text-slate-500 hover:text-amber-400"
                >
                  <Pencil size={15} />
                </button>
                <DeleteButton
                  mutation={deleteCustomer}
                  id={c.id}
                  confirmMessage={`Hapus customer "${c.name}"?`}
                />
              </div>
            </td>
          </tr>
        ))}
      />

      {editing && (
        <EditRecordModal
          title={`Edit Customer — ${editing.name}`}
          fields={[
            { key: "name", label: "Nama Customer" },
            { key: "contact", label: "Kontak (Nama - No. HP)" },
          ]}
          record={editing}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          isSaving={updateCustomer.isPending}
          error={editError}
        />
      )}
    </>
  );
}
