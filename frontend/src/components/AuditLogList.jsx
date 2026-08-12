import { useAuditLogs } from "../hooks/useAuditLogs.js";
import { STAGE_LABEL } from "../lib/constants.js";

const FIELD_LABEL = {
  name: "Nama",
  phone: "No. HP",
  plate: "No. Polisi",
  type: "Tipe Truck",
  status: "Status",
};

const AVAILABILITY_LABEL = {
  available: "Available",
  on_trip: "On Trip",
};

function formatValue(entityType, fieldName, value) {
  if (value === null || value === undefined || value === "") return "-";
  if (fieldName === "status") {
    if (entityType === "order") return STAGE_LABEL[value] || value;
    return AVAILABILITY_LABEL[value] || value;
  }
  return value;
}

// Compact, scrollable change-history list. Used both inside EditRecordModal
// (scoped to one driver/truck) and on OrderDetailPage (scoped to one order's
// status progression) — reads from GET /api/audit-logs filtered by
// entity_type + entity_id.
export function AuditLogList({ entityType, entityId, limit = 15, emptyText = "Belum ada perubahan tercatat." }) {
  const { data, isLoading } = useAuditLogs(
    { entity_type: entityType, entity_id: entityId, page_size: limit },
    { enabled: !!entityId },
  );
  const items = data?.items || [];

  if (isLoading) return <p className="text-sm text-slate-500">Memuat riwayat…</p>;
  if (items.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {items.map((log) => (
        <div key={log.id} className="text-xs border-b border-slate-800/70 last:border-0 pb-2 last:pb-0">
          <div className="flex items-center justify-between gap-2 text-slate-400">
            <span className="font-semibold text-slate-300">{FIELD_LABEL[log.field_name] || log.field_name}</span>
            <span className="shrink-0 font-mono-data">{new Date(log.changed_at).toLocaleString("id-ID")}</span>
          </div>
          <p className="text-slate-300 mt-0.5">
            <span className="text-slate-500">{formatValue(entityType, log.field_name, log.old_value)}</span>
            <span className="text-slate-600"> {"→"} </span>
            <span className="text-amber-400">{formatValue(entityType, log.field_name, log.new_value)}</span>
          </p>
          <p className="text-slate-600 mt-0.5">oleh {log.changed_by_name || "Sistem"}</p>
        </div>
      ))}
    </div>
  );
}
