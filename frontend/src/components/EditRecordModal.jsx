import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { AuditLogList } from "./AuditLogList.jsx";
import { Field } from "./Field.jsx";

function buildForm(fields, record) {
  return Object.fromEntries(fields.map((f) => [f.key, record[f.key] ?? ""]));
}

export function EditRecordModal({
  title,
  fields,
  record,
  onSave,
  onClose,
  isSaving,
  error,
  extraHint,
  historyEntityType,
}) {
  const [form, setForm] = useState(() => buildForm(fields, record));

  useEffect(() => {
    setForm(buildForm(fields, record));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  function submit() {
    if (!form[fields[0].key]) return;
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-condensed text-lg font-bold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>
        {extraHint && <p className="text-xs text-slate-500 -mt-1">{extraHint}</p>}
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key} className={f.full ? "col-span-2" : ""}>
              <Field
                label={f.label}
                type={f.type || "text"}
                value={form[f.key]}
                onChange={(v) => setForm({ ...form, [f.key]: v })}
              />
            </div>
          ))}
        </div>
        {historyEntityType && record?.id && (
          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Riwayat Perubahan
            </h4>
            <AuditLogList entityType={historyEntityType} entityId={record.id} />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-200 px-3 py-2">
            Batal
          </button>
          <button
            onClick={submit}
            disabled={isSaving}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 text-sm font-semibold px-4 py-2 rounded-md"
          >
            {isSaving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
