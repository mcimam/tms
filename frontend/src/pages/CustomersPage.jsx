import { Building2 } from "lucide-react";

import { MasterDataTable } from "../components/MasterDataTable.jsx";
import { useCreateCustomer, useCustomers } from "../hooks/useCustomers.js";

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();

  if (isLoading) return <div className="p-6 text-slate-500 text-sm">Memuat…</div>;

  return (
    <MasterDataTable
      title="Customers"
      icon={Building2}
      addLabel="Customer Baru"
      hint="Daftar customer akan muncul sebagai pilihan saat membuat order baru."
      fields={[
        { key: "name", label: "Nama Customer" },
        { key: "contact", label: "Kontak (Nama - No. HP)" },
      ]}
      onAdd={(form) => createCustomer.mutate(form)}
      columns={["Nama Customer", "Kontak"]}
      rows={customers.map((c) => (
        <tr key={c.id} className="border-b border-slate-800/70 last:border-0">
          <td className="px-4 py-2.5 text-slate-200">{c.name}</td>
          <td className="px-4 py-2.5 text-slate-400">{c.contact || "-"}</td>
        </tr>
      ))}
    />
  );
}
