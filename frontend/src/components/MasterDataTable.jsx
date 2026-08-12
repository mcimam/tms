import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Field } from "./Field.jsx";
import { SearchInput } from "./SearchInput.jsx";

export function MasterDataTable({
  title,
  icon: Icon,
  columns,
  rows,
  fields,
  onAdd,
  addLabel,
  hint,
  search,
  onSearchChange,
  searchPlaceholder,
}) {
  const [showNew, setShowNew] = useState(false);
  const emptyForm = Object.fromEntries(fields.map((f) => [f.key, ""]));
  const [form, setForm] = useState(emptyForm);

  function submit() {
    if (!form[fields[0].key]) return;
    onAdd(form);
    setForm(emptyForm);
    setShowNew(false);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-amber-400" />
          <div>
            <h1 className="font-condensed text-2xl font-bold text-slate-100">{title}</h1>
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-amber-400 text-slate-900 font-semibold text-sm px-3.5 py-2 rounded-md hover:bg-amber-300"
        >
          <Plus size={16} /> {addLabel}
        </button>
      </div>

      {onSearchChange && (
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder || "Cari…"}
          className="max-w-xs"
        />
      )}

      {showNew && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">{addLabel}</h3>
            <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                type={f.type || "text"}
                value={form[f.key]}
                onChange={(v) => setForm({ ...form, [f.key]: v })}
              />
            ))}
          </div>
          <button onClick={submit} className="bg-amber-400 text-slate-900 text-sm font-semibold px-4 py-2 rounded-md hover:bg-amber-300">
            Simpan
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              {columns.map((c) => (
                <th key={c} className="px-4 py-2.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  {search
                    ? "Tidak ada data yang cocok dengan pencarian."
                    : `Belum ada data. Klik "${addLabel}" untuk menambahkan.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
