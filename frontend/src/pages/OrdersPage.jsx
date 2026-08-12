import { ChevronRight, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Field } from "../components/Field.jsx";
import { StatusPill } from "../components/StatusPill.jsx";
import { useCreateCustomer, useCustomers } from "../hooks/useCustomers.js";
import { useCreateOrder, useOrders } from "../hooks/useOrders.js";

const emptyForm = {
  customer_id: "", load_location: "", unload_location: "", ship_date: "", load_time: "",
  cargo_type: "", tonnage: "", notes: "",
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { data: ordersRes, isLoading } = useOrders({ page_size: 100 });
  const { data: customers = [] } = useCustomers();
  const createOrder = useCreateOrder();
  const createCustomer = useCreateCustomer();

  const [showNew, setShowNew] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [form, setForm] = useState(emptyForm);

  const orders = ordersRes?.items || [];

  function submit() {
    if (!form.customer_id || !form.load_location || !form.unload_location) return;
    createOrder.mutate(
      { ...form, customer_id: Number(form.customer_id), ship_date: form.ship_date || undefined },
      { onSuccess: () => { setForm(emptyForm); setShowNew(false); } },
    );
  }

  function saveNewCustomer() {
    if (!newCustomerName.trim()) return;
    createCustomer.mutate(
      { name: newCustomerName.trim() },
      {
        onSuccess: (customer) => {
          setForm((f) => ({ ...f, customer_id: String(customer.id) }));
          setNewCustomerName("");
          setShowNewCustomer(false);
        },
      },
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-condensed text-2xl font-bold text-slate-100">Orders</h1>
          <p className="text-sm text-slate-500">Semua order dari customer</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-amber-400 text-slate-900 font-semibold text-sm px-3.5 py-2 rounded-md hover:bg-amber-300"
        >
          <Plus size={16} /> Order Baru
        </button>
      </div>

      {showNew && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Buat Order Baru</h3>
            <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Customer</span>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Pilih customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {!showNewCustomer ? (
                <button
                  onClick={() => setShowNewCustomer(true)}
                  className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  + Customer baru
                </button>
              ) : (
                <div className="mt-1.5 flex gap-1.5">
                  <input
                    autoFocus
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nama customer baru"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <button onClick={saveNewCustomer} className="px-2.5 bg-amber-400 text-slate-900 text-xs font-semibold rounded-md">
                    Simpan
                  </button>
                  <button
                    onClick={() => { setShowNewCustomer(false); setNewCustomerName(""); }}
                    className="px-2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <Field label="Jenis Barang" value={form.cargo_type} onChange={(v) => setForm({ ...form, cargo_type: v })} />
            <Field label="Lokasi Muat" value={form.load_location} onChange={(v) => setForm({ ...form, load_location: v })} />
            <Field label="Lokasi Bongkar" value={form.unload_location} onChange={(v) => setForm({ ...form, unload_location: v })} />
            <Field label="Tanggal Pengiriman" type="date" value={form.ship_date} onChange={(v) => setForm({ ...form, ship_date: v })} />
            <Field label="Jam Muat" type="time" value={form.load_time} onChange={(v) => setForm({ ...form, load_time: v })} />
            <Field label="Jumlah / Tonase" value={form.tonnage} onChange={(v) => setForm({ ...form, tonnage: v })} />
            <Field label="Catatan" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
          <button onClick={submit} className="bg-amber-400 text-slate-900 text-sm font-semibold px-4 py-2 rounded-md hover:bg-amber-300">
            Simpan Order
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800">
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => navigate(`/orders/${o.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 text-left"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="font-mono-data text-sm text-slate-200">{o.order_no}</p>
                <p className="text-xs text-slate-500">{o.customer_name}</p>
              </div>
              <div className="hidden sm:block text-xs text-slate-400">
                {o.load_location} <ChevronRight size={12} className="inline -mt-0.5" /> {o.unload_location}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusPill status={o.status} />
              <ChevronRight size={16} className="text-slate-600" />
            </div>
          </button>
        ))}
        {!isLoading && orders.length === 0 && (
          <div className="px-4 py-10 text-center text-slate-500 text-sm">
            Belum ada order. Klik "Order Baru" untuk membuat order pertama.
          </div>
        )}
      </div>
    </div>
  );
}
